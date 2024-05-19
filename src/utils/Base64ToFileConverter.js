import fs from "fs"
function Base64ToFileConverter(base64String, filePath) {
    // Remove header from base64 string
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

    // Create buffer from base64 string
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Write buffer to file
    fs.writeFileSync(filePath, imageBuffer);

    return filePath;
}

export default Base64ToFileConverter;