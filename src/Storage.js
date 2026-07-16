/**
 * Persistence helpers for sessions and exported brains.
 */
class Storage {
  static KEY = 'pingpon_v2_session';

  static save(session) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Could not save session:', e);
    }
  }

  static load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Could not load session:', e);
      return null;
    }
  }

  static clear() {
    localStorage.removeItem(this.KEY);
  }

  static exportBrain(best, filename = 'pingpon-brain.json') {
    const blob = new Blob([JSON.stringify(best, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static importBrain(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          resolve(JSON.parse(e.target.result));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
