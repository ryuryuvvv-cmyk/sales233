function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('営業アシスト')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}
