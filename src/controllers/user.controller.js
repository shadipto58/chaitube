import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
import Base64ToFileConverter from "../utils/Base64ToFileConverter.js";
import GenerateOTP from "../utils/GenerateOTP.js";
import { sendMail } from "../utils/mailer.js";



const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})
        
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler( async (req,res) => {
    // Get user details from frontend
    // Validation of Data come from frontend
    // Check if user already exists
    // Check for images for avatar,coverImage
    // Upload image on cloudinary
    // Create user object - create entry on database
    // Remove password and refresh token field from response
    // Return response 


    const { fullname, email, password } = req.body;
    // console.log("Request is:",req);
    // console.log("Request body is:",req.body);
    // console.log("Request files is:",req.files);
    console.log("Request Body is:",req.body);

    // Here i check if any field are empty 
    if(
        [fullname, email, password].some((field)=> field.trim() === "")
    ){
        throw new ApiError(400, "all field are requered")
    }

    // we can check that in this way also
    // if(fullname === ""){
    //     throw new ApiError(400, "fullname is requered")
    // }

    const existUser = await User.findOne({
        $or: [{ fullname }, { email }]
    })

    if(existUser){
        throw new ApiError(409, "username or email already exist")
    }

    const user = await User.create({
        fullname,
        email,
        password
    })
   
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went worng when registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser , "User register successfully")
    )
})

const loginUser = asyncHandler( async (req, res) => {
    // Colect data from Login Form
    // Check if user exist or not
    // If user exist then Find the user
    // Check if password is correct or not
    // If password is correct then generate refresh token
    // Return response

    const { email , password } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is requerd")
    }

    const user = await User.findOne({
        $or: [{ email }]
    })

    if (!user) {
        throw new ApiError(400, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect User or Password don't match!!")
    }

    const {accessToken , refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refresh-token")  

    const options = {
        httpOnly: true,
        secure: true, // Set to true if using HTTPS
        sameSite: 'None', // Must be 'None' for cross-site cookies
        maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
      };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {
                loggedInUser,
                accessToken,
                refreshToken
            },
            "User login successfully")
    )
})
const verifyUser = asyncHandler( async (req, res) => {
    // Colect data from Login Form
    // Check if user exist or not
    // If user exist then Find the user
    // Check if password is correct or not
    // If password is correct then generate refresh token
    // Return response

    const { email  } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is requerd")
    }

    const userfound = await User.findOne({
        $or: [{ email }]
    })

    if (!userfound) {
        throw new ApiError(400, "User does not exist")
    }

    const user = await User.findById(userfound._id).select("-password -refresh-token")  


    return res
    .status(200)
    .json(
        new ApiResponse(200, user ,"User Found")
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    // Remove refresh token from database
    // Remove refresh token from cookie
    // Return response

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(
        new ApiResponse(200,{},"User logout successfully")
    )
})

const refreshAccessToken = asyncHandler( async (req, res)=> {
    // Get refresh token from cookie
    // Check if refresh token exist or not
    // If refresh token exist then Find the user
    // Generate access token
    // Return response

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken ;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id);
        
        if (!user) {
            throw new ApiError(401, "Unauthorized Refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token Expired")
        }
    
        const options = {
            httpOnly: true,
            secure: true,
        }
    
        const {accessToken , newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200,{accessToken , refreshToken :newRefreshToken},"Access Token Refreshed!")
        )
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid Refresh Token Error")
    }

})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    // Get old password from frontend
    // Get new password from frontend
    // Check if old password is correct or not
    // If password is correct then update password
    // Return response

    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

   if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password")
   }

   user.password = newPassword

   await user.save({validateBeforeSave:false})

   return res
   .status(200)
   .json(
       new ApiResponse(200,{},"Password Changed Successfully")
   )

})

const getCurrentUser = asyncHandler( async (req, res) => {
    // Get current user from database
    // Return response
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current User fetched successfully")
    )
})

const updateUser = asyncHandler( async (req, res) => {
    // Get user details from frontend
    // Validation of Data come from frontend
    // Remove password 
    // Return response

    const { fullname, email } = req.body;

    if (!fullname || !email) {
        throw new ApiError(400, "All field are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User updated successfully")
    )
})

const updateUserAvatar = asyncHandler( async (req, res) => {
    // Get user details from frontend
    // Validation of Data come from frontend
    // Remove password 
    // Return response

    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file not found")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Error while uploading avatar on cloudinary")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
   .status(200)
   .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler( async (req, res) => {
    // Get user details from frontend
    // Validation of Data come from frontend
    // Remove password 
    // Return response

    const coverLocalPath = req.file?.path;

    if (!coverLocalPath) {
        throw new ApiError(400, "coverLocalPath file not found")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath);

    if (!coverImage) {
        throw new ApiError(400, "Error while uploading coverImage on cloudinary")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
   .status(200)
   .json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    )
})

const generateOtp = asyncHandler( async (req, res) => {
    const otp = await GenerateOTP()
    const { email }= req.body;
    // console.log("The mail come from fornt",email);
    
    try {
        const emailResult = await sendMail({
            userEmail: email,
            text: "Your OTP for verification",
            subject: "OTP Verification",
            otp: otp
        });
        console.log("Email sent result:", emailResult.messageId);

        if(!(emailResult && emailResult.messageId)){
            throw new ApiError(400, "Error when sending OTP")
        }
        
         // Find the user and update their OTP
         const user = await User.findOne({ email });

         if (!user) {
            throw new ApiError(400, "User not found when sending OTP")
         }

         user.otp = otp; 
        await user.save();

        return res.status(200).json(
            new ApiResponse(201, { OTP: otp }, "OTP sent successfully!")
        );

    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json(
            new ApiResponse(500, null, "Failed to send OTP email")
        );
    }

    return res
    .status(200)
    .json(
        new ApiResponse(201,"Verify Successsfully op!")
    )
})

const verifyOtp = asyncHandler( async (req, res) => {
    const { email , otp } = req.body;
    console.log("The otp and mail fornt",otp,email);
    
    // Find the user and update their OTP
    const user = await User.findOne({ email });
    // console.log("The user:",user);
    

    if (!user) {
       throw new ApiError(400, "User not found when sending OTP")
    }

    if (user.otp!== parseInt(otp)) {
        throw new ApiError(400, "Invalid OTP")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(201,"OTP Verify Successsfull")
    )
})

const resetPassword = asyncHandler( async (req, res) => {
    const { email , password } = req.body;

    
    // Find the user and update their OTP
    const user = await User.findOne({ email });
    console.log("The user:",user);
    

    if (!user) {
       throw new ApiError(400, "User not found when reset password")
    }
    

    user.otp = "";
    user.password =  password;
    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Password Successsfully reset")
    )
})


export { generateOtp , verifyOtp , resetPassword , registerUser , loginUser , verifyUser , logoutUser , refreshAccessToken , changeCurrentPassword ,getCurrentUser , updateUser , updateUserAvatar ,updateUserCoverImage }