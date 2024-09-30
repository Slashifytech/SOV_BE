import mongoose, { Schema } from 'mongoose';

// Schema for Address
const AddressSchema = new Schema({
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
});

// Schema for Personal Information
const PersonalInformationSchema = new Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: AddressSchema,  // Use Address schema for personalInformation and gic.personalDetails
});

// Schema for Education Details
const EducationDetailsSchema = new Schema({
    educationLevel: { 
        type: String, 
        enum: ['Diploma', 'Post Graduate', 'Under Graduate'], 
        required: true 
    },
    markSheet: { 
        type: [String],  // Array of strings to store multiple URLs or file paths
        default: []      // Optional: initialize as an empty array if no marksheets are provided
    }
});

// Schema for Preferences
const PreferencesSchema = new Schema({
    country: { type: String, required: true },
    institution: { type: String, required: true },
    course: { type: String, required: true },
    intake: { type: String, required: true },
});

// Schema for IELTS Score
const IELTSSchema = new Schema({
    reading: { type: Number },
    speaking: { type: Number },
    writing: { type: Number },
    listening: { type: Number },
    overallBand: { type: Number },
});

// Schema for Document Upload
const DocumentUploadSchema = new Schema({
    offerLetter: { type: String },  // URL or file path to the uploaded offer letter
    letterOfAcceptance: { type: String },  // URL or file path to the uploaded letter of acceptance
});

// Main schema for Visa Registration
const InstitutionSchema = new Schema({
    offerLetter: {
        personalInformation: PersonalInformationSchema,
        educationDetails: EducationDetailsSchema,
        preferences: PreferencesSchema,
        ieltsScore: IELTSSchema,
        type:{
            type: String,
            default: "Offer Letter"
        },
        status: {
            type: String,
            enum: ['under review', 'success', 'reject'],  // Valid status values
             default: 'under review'
        },
        message: { type: String }  // Optional message field
    },
    gic: { 
        personalDetails: PersonalInformationSchema,  // Embed Personal Details Schema under gic
        documentUpload: DocumentUploadSchema,  // Embed Document Upload Schema under gic
        type:{
            type: String,
            default: "GIC"
        },
        status: {
            type: String,
            enum: ['under review', 'success', 'reject'],  // Valid status values
            default: 'under review'
        },
        message: { type: String }  // Optional message field
    },
    studentInformationId: {
        type: Schema.Types.ObjectId,
        ref: "StudentInformation",
        required: true
    },
    applicationId: {
        type: String,
        unique: true,
        required: true
    },
    userId: {
        type: String,
        required: true
    }
}, {
    timestamps: true  // Automatically add createdAt and updatedAt fields
});

// Model creation
export const Institution = mongoose.model("Institution", InstitutionSchema);
