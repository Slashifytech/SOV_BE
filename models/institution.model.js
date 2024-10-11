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
        // enum: ['Diploma', 'Post Graduate', 'Under Graduate'], 
        required: true 
    },
    markSheet10: { 
        type: String,  // Array of strings to store multiple URLs or file paths
    },
    markSheet12: { 
        type: String,  // Array of strings to store multiple URLs or file paths
    },
    markSheetUnderGraduate: { 
        type: String,  // Array of strings to store multiple URLs or file paths
    },
    markSheetPostGraduate: { 
        type: String,  // Array of strings to store multiple URLs or file paths
    },
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
    feeReceipt: { type: String },  // URL or file path to the uploaded letter of acceptance
    gicLetter: { type: String },  
    medical: { type: String },  
    pcc: { type: String },  
    pal: { type: String },  
    ielts: { type: String },  
});

// Schema for PTE Scores
const PTESchema = new Schema({
    listening: { type: Number, required: false },
    reading: { type: Number, required: false },
    writing: { type: Number, required: false },
    speaking: { type: Number, required: false },
    overallBands: { type: Number, required: false },
}, { _id: false });  // Set _id to false if you don't want separate IDs for embedded sub-documents

// Schema for TOEFL Scores
const TOEFLSchema = new Schema({
    listening: { type: Number, required: false },
    reading: { type: Number, required: false },
    writing: { type: Number, required: false },
    speaking: { type: Number, required: false },
    overallBands: { type: Number, required: false },
}, { _id: false });

// Schema for Document Upload
const CertificateUploadSchema = new Schema({
    url: {
        type: [String],  // Array of strings
    }
}, { _id: false });


const StudentDocumentSchema = new Schema({
    aadharCard: {
        type:String
    },
    panCard: {
        type:String
    }
}, { _id: false });

const ParentDocumentSchema = new Schema({
    fatherAadharCard: {
        type:String
    },
    fatherPanCard: {
        type:String
    },
    motherAadharCard: {
        type:String
    },
    motherPanCard: {
        type:String
    }
}, { _id: false });

const OfferLetterAnsPassportSchema = new Schema({
    offerLetter: {
        type:String
    },
    passport: {
        type:String
    }
}, { _id: false });


// Main schema for Visa Registration
const InstitutionSchema = new Schema({
    offerLetter: {
        personalInformation: PersonalInformationSchema,
        educationDetails: EducationDetailsSchema,
        preferences: PreferencesSchema,
        ieltsScore: IELTSSchema,
        ptes: PTESchema,
        toefl:TOEFLSchema,
        certificate: CertificateUploadSchema,
        type:{
            type: String,
            default: "Offer Letter"
        },
        status: {
            type: String,
            enum: ['underreview', 'completed', 'reject'],  // Valid status values
             default: 'underreview'
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
            enum: ['underreview', 'completed', 'reject'],  // Valid status values
            default: 'underreview'
        },
        message: { type: String }  // Optional message field
    },
    courseFeeApplication:{
        personalDetails: PersonalInformationSchema,
        studentDocument: StudentDocumentSchema,
        parentDocument: ParentDocumentSchema,
        offerLetterAnsPassport:OfferLetterAnsPassportSchema 
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
