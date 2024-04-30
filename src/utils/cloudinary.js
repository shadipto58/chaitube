import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARI_CLOUD_NAME, 
  api_key: process.env.CLOUDINARI_API_KEY, 
  api_secret: process.env.CLOUDINARI_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // console.log("localFilePath in cloudinary",localFilePath);

        //upload the file on cloundinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //  file has uploaded successfully
        // console.log("file is uploaded on cloudinary",response.url);
        // console.log("file is uploaded on cloudinary response",response);

        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove localy saved temporary file when upload faild

        return null
    }
}

export { uploadOnCloudinary }