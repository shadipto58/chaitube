import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler ( async (req,res) => {
    // Get user details from frontend
    // Validation of Data come from frontend
    // Check if user already exists
    // Check for images for avatar,coverImage
    // Upload image on cloudinary
    // Create user object - create entry on database
    // Remove password and refresh token field from response
    // Return response 


    const { username, fullname, email, password } = req.body;

    // Here i check if any field are empty 
    if(
        [fullname, email, username, password].some((field)=> field.trim() === "")
    ){
        throw new ApiError(400, "all field are requered")
    }

    // we can check that in this way also
    // if(fullname === ""){
    //     throw new ApiError(400, "fullname is requered")
    // }

    const existUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existUser){
        throw new ApiError(409, "username or email already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path ;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // console.log("avatar er is",avatar);
   

    if(!avatar){
        throw new ApiError(400, "Avatar is required 2")
    }
    
    const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
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


export { registerUser }