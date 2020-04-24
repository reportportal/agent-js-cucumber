class DocumentsStorage {
  constructor() {
    this.gherkinDocuments = {};
    this.pickleDocuments = {};
  }

  cacheDocument(gherkinDocument) {
    this.gherkinDocuments[gherkinDocument.uri] = gherkinDocument.document;
  }

  cacheAcceptedPickle(event) {
    this.pickleDocuments[event.uri] = event.pickle;
  }

  isAcceptedPickleCached(event) {
    return !!this.pickleDocuments[event.uri];
  }
}

module.exports = DocumentsStorage;
