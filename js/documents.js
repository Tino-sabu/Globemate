/* ========================================
   GlobeMate — Document Storage Module
   ======================================== */

const DocumentStore = (() => {
  let documents = [];
  let reminders = loadFromLocal('reminders') || [];
  const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
  const DOCUMENTS_COLLECTION = 'user_documents';
  const USER_COLLECTION = 'users';
  const USER_DOCS_SUBCOLLECTION = 'documents';
  let authWatcherBound = false;

  function init() {
    try {
      const docForm = $('#docForm');
      const reminderForm = $('#reminderForm');
      const docFile = $('#docFile');
      
      if (docForm) docForm.addEventListener('submit', saveDocument);
      if (reminderForm) reminderForm.addEventListener('submit', saveReminder);
      if (docFile) docFile.addEventListener('change', handleFileSelect);
      
      renderDocumentsLoading();
      renderReminders();
      checkReminders();
      bindAuthWatcher();
      loadDocumentsFromCloud();
    } catch (error) {
      console.error('DocumentStore initialization error:', error);
    }
  }

  function bindAuthWatcher() {
    if (authWatcherBound) return;
    const auth = window.Auth && typeof window.Auth.getAuth === 'function' ? window.Auth.getAuth() : null;
    if (!auth || typeof auth.onAuthStateChanged !== 'function') return;

    auth.onAuthStateChanged(() => {
      loadDocumentsFromCloud();
    });
    authWatcherBound = true;
  }

  function renderDocumentsLoading() {
    const container = $('#documentsList');
    if (!container) return;
    container.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading saved documents...</p></div>`;
  }

  function getCurrentUser() {
    if (window.Auth && window.Auth.currentUser) return window.Auth.currentUser;
    const auth = window.Auth && typeof window.Auth.getAuth === 'function' ? window.Auth.getAuth() : null;
    return auth && auth.currentUser ? auth.currentUser : null;
  }

  function getCloudServices() {
    const user = getCurrentUser();
    const db = window.Auth && typeof window.Auth.getDB === 'function' ? window.Auth.getDB() : null;
    const storage = (typeof firebase !== 'undefined' && firebase.storage) ? firebase.storage() : null;
    return { user, db, storage };
  }

  function userDocsCollection(db, uid) {
    return db.collection(USER_COLLECTION).doc(uid).collection(USER_DOCS_SUBCOLLECTION);
  }

  async function listCloudDocs(db, uid) {
    const nestedSnapshot = await userDocsCollection(db, uid).get();
    let rootSnapshot = { docs: [] };

    // Backward-compatible read for documents previously saved in root collection.
    try {
      rootSnapshot = await db.collection(DOCUMENTS_COLLECTION).where('userId', '==', uid).get();
    } catch (error) {
      console.warn('Root documents collection not readable with current rules, using user-scoped collection only.', error);
    }

    const nestedDocs = nestedSnapshot.docs.map((docSnap) => normalizeCloudDocument(docSnap, 'nested'));
    const rootDocs = rootSnapshot.docs.map((docSnap) => normalizeCloudDocument(docSnap, 'root'));
    const mergedByKey = new Map();

    [...nestedDocs, ...rootDocs].forEach((doc) => {
      const key = doc.storagePath || `${doc.name}|${doc.fileName}|${doc.createdAt}`;
      if (!mergedByKey.has(key)) mergedByKey.set(key, doc);
    });

    return Array.from(mergedByKey.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function sanitizeFileName(fileName) {
    return (fileName || 'document')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
  }

  function normalizeCloudDocument(docSnap, source = 'nested') {
    const data = docSnap.data() || {};
    const createdAtValue = data.createdAt && typeof data.createdAt.toDate === 'function'
      ? data.createdAt.toDate().toISOString()
      : (data.createdAt || data.createdAtClient || new Date().toISOString());

    return {
      id: docSnap.id,
      source,
      name: data.name || 'Untitled Document',
      type: data.type || 'other',
      expiry: data.expiry || '',
      notes: data.notes || '',
      fileName: data.fileName || '',
      fileType: data.fileType || '',
      fileUrl: data.fileUrl || '',
      storagePath: data.storagePath || '',
      createdAt: createdAtValue
    };
  }

  async function loadDocumentsFromCloud() {
    const container = $('#documentsList');
    if (!container) return;

    const { user, db } = getCloudServices();
    if (!user) {
      documents = [];
      container.innerHTML = `<div class="empty-state"><i class="fas fa-lock"></i><p>Please log in to view your saved documents.</p></div>`;
      return;
    }
    if (!db) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Cloud service unavailable. Please refresh and try again.</p></div>`;
      return;
    }

    try {
      renderDocumentsLoading();
      documents = await listCloudDocs(db, user.uid);

      renderDocuments();
    } catch (error) {
      console.error('Failed to load documents from cloud:', error);
      container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Could not load documents from Firebase.</p></div>`;
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    const fileNameEl = $('#fileName');
    if (fileNameEl) fileNameEl.textContent = file ? file.name : '';
  }

  async function saveDocument(e) {
    e.preventDefault();
    const selectedFile = $('#docFile').files[0] || null;
    const { user, db, storage } = getCloudServices();
    if (!user) {
      showToast('Please log in to store documents in Firebase.', 'warning');
      return;
    }
    if (!db || !storage) {
      showToast('Firebase services are not ready. Please refresh and try again.', 'error');
      return;
    }

    let fileUrl = '';
    let storagePath = '';
    let fileType = '';

    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        showToast('File is too large. Please upload a file under 8 MB.', 'error');
        return;
      }

      try {
        const sanitizedName = sanitizeFileName(selectedFile.name);
        storagePath = `documents/${user.uid}/${Date.now()}_${sanitizedName}`;
        const uploadTaskSnapshot = await storage.ref().child(storagePath).put(selectedFile);
        fileUrl = await uploadTaskSnapshot.ref.getDownloadURL();
        fileType = selectedFile.type || '';
      } catch (error) {
        console.error('Failed to upload selected document file:', error);
        showToast('Upload failed. Please try again.', 'error');
        return;
      }
    }

    try {
      const docRef = userDocsCollection(db, user.uid).doc();
      await docRef.set({
        userId: user.uid,
        name: $('#docName').value,
        type: $('#docType').value,
        expiry: $('#docExpiry').value,
        notes: $('#docNotes').value,
        fileName: selectedFile?.name || '',
        fileType,
        fileUrl,
        storagePath,
        createdAtClient: new Date().toISOString(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      $('#docForm').reset();
      const fileNameEl = $('#fileName');
      if (fileNameEl) fileNameEl.textContent = '';
      await loadDocumentsFromCloud();
      showToast('Document saved to Firebase!', 'success');
    } catch (error) {
      console.error('Failed to save document metadata:', error);
      showToast('Could not save document details.', 'error');
    }
  }

  function openDocument(id) {
    const doc = documents.find((item) => item.id === id);
    if (!doc) {
      showToast('Document not found', 'error');
      return;
    }

    if (!doc.fileUrl) {
      showToast('No uploaded file found for this document.', 'warning');
      return;
    }

    const opened = window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      const fallbackLink = document.createElement('a');
      fallbackLink.href = doc.fileUrl;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      fallbackLink.click();
    }
  }

  async function deleteDocument(id) {
    const doc = documents.find((item) => item.id === id);
    if (!doc) {
      showToast('Document not found', 'error');
      return;
    }

    const { user, db, storage } = getCloudServices();
    if (!user || !db) {
      showToast('Please log in to manage cloud documents.', 'warning');
      return;
    }

    try {
      if (doc.storagePath && storage) {
        await storage.ref().child(doc.storagePath).delete().catch((error) => {
          if (error && error.code !== 'storage/object-not-found') {
            throw error;
          }
        });
      }

      if (doc.source === 'root') {
        await db.collection(DOCUMENTS_COLLECTION).doc(doc.id).delete();
      } else {
        await userDocsCollection(db, user.uid).doc(doc.id).delete();
      }
      documents = documents.filter((item) => item.id !== id);
      renderDocuments();
      showToast('Document removed', 'warning');
    } catch (error) {
      console.error('Failed to delete document:', error);
      showToast('Could not delete document.', 'error');
    }
  }

  function renderDocuments() {
    const container = $('#documentsList');
    if (!container) return;
    
    if (documents.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-folder-plus"></i><p>No documents stored yet</p></div>`;
      return;
    }

    const icons = { 
      passport: 'passport', 
      visa: 'stamp', 
      ticket: 'ticket-alt', 
      hotel: 'hotel', 
      insurance: 'file-shield', 
      id: 'id-card', 
      other: 'file-alt' 
    };

    container.innerHTML = documents.map(doc => `
      <div class="doc-item">
        <div class="doc-icon ${doc.type}">
          <i class="fas fa-${icons[doc.type] || 'file'}"></i>
        </div>
        <div class="doc-info">
          <h4>${doc.name}</h4>
          <p>${doc.expiry ? `Expires: ${formatDate(doc.expiry)}` : doc.notes || doc.type}</p>
          ${doc.fileName ? `<p><i class="fas fa-paperclip"></i> ${doc.fileName}</p>` : ''}
        </div>
        <div class="doc-actions">
          <button class="btn-open" onclick="DocumentStore.openDocument('${doc.id}')" title="Open document" ${doc.fileUrl ? '' : 'disabled'}>
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-delete" onclick="DocumentStore.deleteDocument('${doc.id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  function saveReminder(e) {
    e.preventDefault();
    const reminder = {
      id: Date.now(),
      title: $('#reminderTitle').value,
      date: $('#reminderDate').value,
      priority: $('#reminderPriority').value,
      completed: false
    };

    reminders.push(reminder);
    saveToLocal('reminders', reminders);
    $('#reminderForm').reset();
    renderReminders();
    showToast('Reminder set!');
  }

  function deleteReminder(id) {
    reminders = reminders.filter(r => r.id !== id);
    saveToLocal('reminders', reminders);
    renderReminders();
  }

  function renderReminders() {
    const container = $('#remindersList');
    if (!container) return;
    
    if (reminders.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No reminders set yet</p></div>`;
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const sorted = [...reminders].sort((a, b) => new Date(a.date) - new Date(b.date));

    container.innerHTML = sorted.map(r => {
      const isOverdue = r.date < today;
      const isToday = r.date === today;
      const badge = isToday ? 'today' : isOverdue ? 'overdue' : 'upcoming';
      const badgeText = isToday ? 'Today' : isOverdue ? 'Overdue' : 'Upcoming';

      return `
        <div class="reminder-item">
          <div class="reminder-priority ${r.priority}"></div>
          <div class="reminder-info">
            <h4>${r.title}</h4>
            <p><i class="fas fa-calendar"></i> ${formatDate(r.date)}</p>
          </div>
          <span class="reminder-badge ${badge}">${badgeText}</span>
          <button class="btn-delete" onclick="DocumentStore.deleteReminder(${r.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');
  }

  function checkReminders() {
    const today = new Date().toISOString().split('T')[0];
    const todayReminders = reminders.filter(r => r.date === today);
    const overdueReminders = reminders.filter(r => r.date < today);

    if (todayReminders.length > 0) {
      setTimeout(() => showToast(`You have ${todayReminders.length} reminder(s) for today!`, 'warning'), 1500);
    }
    if (overdueReminders.length > 0) {
      setTimeout(() => showToast(`You have ${overdueReminders.length} overdue reminder(s)!`, 'error'), 3000);
    }
  }

  function cleanup() {
    // Clean up if needed
  }

  return { init, openDocument, deleteDocument, deleteReminder, cleanup };
})();

// Expose to global scope
if (typeof window !== 'undefined') {
  window.DocumentStore = DocumentStore;
}

// Register with PageLoader
if (typeof PageLoader !== 'undefined') {
  PageLoader.registerModule('documents', DocumentStore);
} else {
  // Auto-initialize if PageLoader not available
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DocumentStore.init());
  } else {
    DocumentStore.init();
  }
}
