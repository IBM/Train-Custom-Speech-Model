function pageLoaded() {
  if (typeof afterBodyLoaded === 'function') {
    afterBodyLoaded();
  }
}
