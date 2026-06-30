(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.IconUpload = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function buildUploadCandidates(location) {
    const candidates = [];
    const add = (value) => {
      if (value && !candidates.includes(value)) {
        candidates.push(value);
      }
    };

    const origin = location && typeof location.origin === 'string' && location.origin ? location.origin : '';
    if (origin) {
      add(new URL('/upload-icon', location.href).toString());
    }

    add('http://127.0.0.1:3000/upload-icon');
    add('http://localhost:3000/upload-icon');
    add('http://127.0.0.1:3001/upload-icon');
    add('http://localhost:3001/upload-icon');

    return candidates;
  }

  async function uploadIcon(file, filename, fetchImpl = fetch) {
    if (!file) {
      throw new Error('Please choose a file first.');
    }

    const location = typeof window !== 'undefined' && window.location
      ? window.location
      : { href: 'http://localhost/', origin: 'http://localhost', protocol: 'http:' };

    const candidates = buildUploadCandidates(location);
    let lastError = null;

    for (const endpoint of candidates) {
      try {
        const formData = new FormData();
        formData.append('icon', file);
        formData.append('filename', filename || file.name || 'icon');

        const response = await fetchImpl(endpoint, {
          method: 'POST',
          body: formData
        });

        if (response && response.ok) {
          return { response, endpoint };
        }

        // Non-2xx HTTP response - record as lastError and try next candidate
        lastError = new Error(`Icon upload to ${endpoint} failed: HTTP ${response.status} ${response.statusText}`);
      } catch (error) {
        // fetch throws a TypeError on network errors or CORS failures in browsers
        if (error instanceof TypeError && /failed to fetch/i.test(String(error.message))) {
          lastError = new Error(`Network error when contacting ${endpoint}: ${error.message}. Is the server running and CORS allowed?`);
        } else {
          lastError = error;
        }
      }
    }

    // Provide a helpful aggregated error message
    const suggestion = 'Start the site server with "node server.js" and ensure CORS allows requests from this page.';
    if (lastError) {
      throw new Error(`${lastError.message} ${suggestion}`);
    }

    throw new Error('Unable to reach the icon upload server. ' + suggestion);
  }

  return {
    buildUploadCandidates,
    uploadIcon
  };
});
