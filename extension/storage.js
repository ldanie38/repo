// This keeps getLabels / setLabels logic reusable between popup, labels page, and background.//



export function getLabels(cb) {
    chrome.storage.local.get({ labels: [] }, (data) => cb(data.labels));
  }
  
  export function setLabels(labels, cb) {
    chrome.storage.local.set({ labels }, () => cb?.());
  }
  

