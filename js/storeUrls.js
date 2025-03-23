function doPost(e) {
  try {
      var sheet = SpreadsheetApp.openById("AKfycbx3w0oY9l2BRk-6C4jTYF6Mox0koSklUzDtZZlv45npXyVpcmI0fxFo5BxteavnpEtj").getSheetByName("Links");
      var data = JSON.parse(e.postData.contents);

      if (!data.links || !Array.isArray(data.links)) {
          throw new Error("Invalid data format");
      }

      data.links.forEach(link => {
          sheet.appendRow([new Date(), link]);
      });

      return ContentService.createTextOutput(JSON.stringify({ status: "Success" }))
                           .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({ status: "Error", message: error.message }))
                           .setMimeType(ContentService.MimeType.JSON);
  }
}
