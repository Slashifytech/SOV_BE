import mongoose from 'mongoose';
import { Institute } from "../models/institute.model.js"; // Adjust the import path if necessary
import connectDb from '../db/index.js';

// Sample institute data as an array of objects
const instituteData = [
    { instituteName: "University of Surrey", country: "UK" },
    { instituteName: "Solent University", country: "UK" },
    { instituteName: "Buckinghamshire New University", country: "UK" },
    { instituteName: "University of East Anglia", country: "UK" },
    { instituteName: "University of Bedfordshire", country: "UK" },
    { instituteName: "University of Bolton", country: "UK" },
    { instituteName: "University of Lincoln", country: "UK" },
    { instituteName: "University of West London", country: "UK" },
    { instituteName: "London Metropolitan University", country: "UK" },
    { instituteName: "University of Westminster", country: "UK" },
    { instituteName: "St. Mary's University", country: "UK" },
    { instituteName: "York St. John University", country: "UK" },
    { instituteName: "University of Chester", country: "UK" },
    { instituteName: "Leeds Becket University", country: "UK" },
    { instituteName: "University of Bradford", country: "UK" },
    { instituteName: "Bishop Grosseteste university", country: "UK" },
    { instituteName: "Anglia Ruskin University", country: "UK" },
    { instituteName: "Arts University Bournemouth", country: "UK" },
    { instituteName: "Bath Spa University", country: "UK" },
    { instituteName: "Bishop Grosseteste University", country: "UK" },
    { instituteName: "SU to Swansea University", country: "UK" },
    { instituteName: "HIC to University of Herefordshire", country: "UK" },
    { instituteName: "UNIC to University of Northampton", country: "UK" },
    { instituteName: "UPIC to University of Plymouth", country: "UK" },
    { instituteName: "ICP to University of Portsmouth", country: "UK" },
    { instituteName: "Buckinghamshire New University", country: "UK" },
    { instituteName: "Cardiff University", country: "UK" },
    { instituteName: "Durham University", country: "UK" },
    { instituteName: "London Metropoliton University", country: "UK" },
    { instituteName: "Leeds Beckett University", country: "UK" },
    { instituteName: "Liverpool John Moores University", country: "UK" },
    { instituteName: "Middlesex University", country: "UK" },
    { instituteName: "Nottingham Trent University", country: "UK" },
    { instituteName: "Queen Mary University of London", country: "UK" },
    { instituteName: "Richmond University - The American University in London", country: "UK" },
    { instituteName: "Teesside University", country: "UK" },
    { instituteName: "University College Dublin", country: "UK" },
    { instituteName: "University of Aberdeen", country: "UK" },
    { instituteName: "University of Bristol", country: "UK" },
    { instituteName: "The University of Law", country: "UK" },
    { instituteName: "University College Birmingham", country: "UK" },
    { instituteName: "University for the Creative Arts (UG/PG Pathway)", country: "UK" },
    { instituteName: "University of Chester", country: "UK" },
    { instituteName: "University of Essex", country: "UK" },
    { instituteName: "University of Huddersfield", country: "UK" },
    { instituteName: "University of Leeds", country: "UK" },
    { instituteName: "University of Nottingham", country: "UK" },
    { instituteName: "University of Roehampton", country: "UK" },
    { instituteName: "University of Sheffield", country: "UK" },
    { instituteName: "University of Sussex", country: "UK" },
    { instituteName: "UWIC ‐ University of Worcester International College (UG/PG Pathway)", country: "UK" },
    { instituteName: "University of Westminster", country: "UK" },
    { instituteName: "University of the West of England", country: "UK" },
    { instituteName: "University of the West of Scotland", country: "UK" },
    { instituteName: "Florida Atlantic University", country: "USA" },
{ instituteName: "University of Idaho", country: "USA" },
{ instituteName: "University of Massachusetts", country: "USA" },
{ instituteName: "Adelphi University", country: "USA" },
{ instituteName: "Alvernia University", country: "USA" },
{ instituteName: "American University", country: "USA" },
{ instituteName: "American Collegiate Los Angeles", country: "USA" },
{ instituteName: "American Collegiate Washington DC", country: "USA" },
{ instituteName: "Atlantis University", country: "USA" },
{ instituteName: "Auburn University at Montgomery", country: "USA" },
{ instituteName: "Auburn University", country: "USA" },
{ instituteName: "Avila University", country: "USA" },
{ instituteName: "Baylor University", country: "USA" },
{ instituteName: "Bay Atlantic University", country: "USA" },
{ instituteName: "Capital University", country: "USA" },
{ instituteName: "Central Michigan University", country: "USA" },
{ instituteName: "Clarks University", country: "USA" },
{ instituteName: "Community College of Spokane", country: "USA" },
{ instituteName: "Concordia University", country: "USA" },
{ instituteName: "Concordia Saint Paul University", country: "USA" },
{ instituteName: "Cleveland State University", country: "USA" },
{ instituteName: "DePaul University", country: "USA" },
{ instituteName: "Drake University", country: "USA" },
{ instituteName: "Duke University", country: "USA" },
{ instituteName: "Duquesne University", country: "USA" },
{ instituteName: "Endicott College", country: "USA" },
{ instituteName: "Edgewood College", country: "USA" },
{ instituteName: "Florida International University", country: "USA" },
{ instituteName: "Florida Polytechnic University", country: "USA" },
{ instituteName: "Gonzaga University", country: "USA" },
{ instituteName: "Herzing University", country: "USA" },
{ instituteName: "Hilbert College", country: "USA" },
{ instituteName: "Hillsboro Aero Academy", country: "USA" },
{ instituteName: "American International College", country: "USA" },
{ instituteName: "James Madison University", country: "USA" },
{ instituteName: "Johnson and Wales University", country: "USA" },
{ instituteName: "Lipscomb University", country: "USA" },
{ instituteName: "Louisiana State University", country: "USA" },
{ instituteName: "Long Island University", country: "USA" },
{ instituteName: "Lynn University", country: "USA" },
{ instituteName: "Marconi International University", country: "USA" },
{ instituteName: "Marquette University", country: "USA" },
{ instituteName: "Middle Tennessee State University", country: "USA" },
{ instituteName: "Montana State University Billings(MSUB)", country: "USA" },
{ instituteName: "West New England University", country: "USA" },
{ instituteName: "New York Film Academy", country: "USA" },
{ instituteName: "Nichols College", country: "USA" },
{ instituteName: "North Park University", country: "USA" },
{ instituteName: "Paul Smith’s College", country: "USA" },
{ instituteName: "Radford University", country: "USA" },
{ instituteName: "Shoreline Community College", country: "USA" },
{ instituteName: "Seattle Pacific University (SPU)", country: "USA" },
{ instituteName: "Stevens Institute of Technology (SIT)", country: "USA" },
{ instituteName: "Thomas College", country: "USA" },
{ instituteName: "Texas A&M University Corpus Christi", country: "USA" },
{ instituteName: "The Culinary Institute of America", country: "USA" },
{ instituteName: "University of Kansas", country: "USA" },
{ instituteName: "UMBC (University of Maryland Baltimore County)", country: "USA" },
{ instituteName: "University of Arizona", country: "USA" },
{ instituteName: "University of Central Florida", country: "USA" },
{ instituteName: "University of Charleston", country: "USA" },
{ instituteName: "University of Dayton", country: "USA" },
{ instituteName: "University of Hartford", country: "USA" },
{ instituteName: "University of Idaho", country: "USA" },
{ instituteName: "University of Illinois at Chicago", country: "USA" },
{ instituteName: "University of North Texas", country: "USA" },
{ instituteName: "University of Mississippi", country: "USA" },
{ instituteName: "University of Massachusetts Boston", country: "USA" },
{ instituteName: "University of Missouri-St. Louis", country: "USA" },
{ instituteName: "University of Nebraska", country: "USA" },
{ instituteName: "University of The Pacific", country: "USA" },
{ instituteName: "University of South Carolina", country: "USA" },
{ instituteName: "University of St. Thomas", country: "USA" },
{ instituteName: "University of Utah", country: "USA" },
{ instituteName: "University of Vermont", country: "USA" },
{ instituteName: "Virginia Wesleyan University", country: "USA" },
{ instituteName: "Webster University", country: "USA" },
{ instituteName: "Western Washington University", country: "USA" },
{ instituteName: "Xavier University", country: "USA" },
{ instituteName: "Lancaster University Leipzig", country: "Germany" },
{ instituteName: "Schiller International University (Global Education Holding)", country: "Germany" },
{ instituteName: "Dresden International University", country: "Germany" },
{ instituteName: "BSBI - Berlin School of Business and Innovation", country: "Germany" },
{ instituteName: "Arden University", country: "Germany" },
{ instituteName: "Steinbis University", country: "Germany" },
{ instituteName: "HKA - Karlsruhe University of Applied Sciences", country: "Germany" },
{ instituteName: "Bucerius Law School", country: "Germany" },
{ instituteName: "European School of Management and Technology", country: "Germany" },
{ instituteName: "Berlin School of Business and Innovation", country: "Germany" },
{ instituteName: "University of Mannheim", country: "Germany" },
{ instituteName: "SRH University", country: "Germany" },
{ instituteName: "Universität Bayreuth", country: "Germany" },
{ instituteName: "International Psychoanalytic University", country: "Germany" },
{ instituteName: "Universität Bielefeld", country: "Germany" },
{ instituteName: "Universität Erfurt", country: "Germany" },
{ instituteName: "Universität Greifswald", country: "Germany" },
{ instituteName: "Universität Stuttgart", country: "Germany" },
{ instituteName: "Berlin International University of Applied Sciences", country: "Germany" },
{ instituteName: "Touro College Berlin", country: "Germany" },
{ instituteName: "ICN International College Paris", country: "France" },
{ instituteName: "Audencia Business School", country: "France" },
{ instituteName: "Institut Mines-Telecom Business School", country: "France" },
{ instituteName: "NEOMA Business School", country: "France" },
{ instituteName: "Paris School of Business", country: "France" },
{ instituteName: "emlyon business school", country: "France" },
{ instituteName: "Montpellier Business School", country: "France" },
{ instituteName: "IPAG Business School", country: "France" },
{ instituteName: "Grenoble Ecole de Management", country: "France" },
{ instituteName: "TAMPERE UNIVERSITY", country: "Finland" },
{ instituteName: "EIT Urban Mobility Master School", country: "Finland" },
{ instituteName: "Arcada University of Applied Sciences", country: "Finland" },
{ instituteName: "Hanken School of Economics", country: "Finland" },
{ instituteName: "Maynooth University", country: "Italy" },
{ instituteName: "IBAT College Dublin", country: "Italy" },
{ instituteName: "University College Dublin", country: "Italy" },
{ instituteName: "ATMC (Australian Technical & Management Colleges) – Federation University", country: "Australia" },
{ instituteName: "Bond University", country: "Australia" },
{ instituteName: "Charles Sturt University Sydney", country: "Australia" },
{ instituteName: "Deakin College to Deakin University", country: "Australia" },
{ instituteName: "Edith Cowan College to Edith Cowan University", country: "Australia" },
{ instituteName: "Eynesbury College to UNISA or University of", country: "Australia" },
{ instituteName: "Griffith College to Griffith University", country: "Australia" },
{ instituteName: "La Trobe College to La Trobe University, Melbourne", country: "Australia" },
{ instituteName: "La Trobe College to La Trobe University Sydney", country: "Australia" },
{ instituteName: "SAIBT (South Australian Institute of Business and Technology) to UNISA (University of South Australia)", country: "Australia" },
{ instituteName: "SIBT (Sydney Institute of Business and Technology) to Western Sydney University", country: "Australia" },
{ instituteName: "University of Canberra International College to University of Canberra", country: "Australia" },
{ instituteName: "Western Sydney University International College to Western Sydney University", country: "Australia" },
{ instituteName: "Charles Darwin University", country: "Australia" },
{ instituteName: "University of Tasmania", country: "Australia" },
{ instituteName: "University of Tasmania, Melbourne Campus", country: "Australia" },
{ instituteName: "Swinburne University of Technology", country: "Australia" },
{ instituteName: "Curtin University", country: "Australia" },
{ instituteName: "Flinders University", country: "Australia" },
{ instituteName: "James Cook University", country: "Australia" },
{ instituteName: "Queensland University of Technology", country: "Australia" },
{ instituteName: "Southern Cross University", country: "Australia" },
{ instituteName: "University of Sunshine Coast", country: "Australia" },
{ instituteName: "University of Sydney", country: "Australia" },
{ instituteName: "Victoria University", country: "Australia" },

{ instituteName: "Acadia University", country: "Canada" },
{ instituteName: "Acsenda College", country: "Canada" },
{ instituteName: "Adler University", country: "Canada" },
{ instituteName: "Alexander College", country: "Canada" },
{ instituteName: "Algonquin College", country: "Canada" },
{ instituteName: "Bow Valley College", country: "Canada" },
{ instituteName: "British Columbia Institute of Technology (BCIT)", country: "Canada" },
{ instituteName: "Brock University", country: "Canada" },
{ instituteName: "Cambrian College", country: "Canada" },
{ instituteName: "Cape Breton University (CBU)", country: "Canada" },
{ instituteName: "Capilano University", country: "Canada" },
{ instituteName: "College of Rockies", country: "Canada" },
{ instituteName: "Conestoga College", country: "Canada" },
{ instituteName: "Douglas College", country: "Canada" },
{ instituteName: "Durham College", country: "Canada" },
{ instituteName: "Fanshawe College", country: "Canada" },
{ instituteName: "George Brown College", country: "Canada" },
{ instituteName: "Great Plains College", country: "Canada" },
{ instituteName: "Humber College", country: "Canada" },
{ instituteName: "Insignia College", country: "Canada" },
{ instituteName: "International College of Manitoba (ICM) to University of Manitoba", country: "Canada" },
{ instituteName: "Kings University College @ University of Western Ontario", country: "Canada" },
{ instituteName: "Kwantlen Polytechnic University", country: "Canada" },
{ instituteName: "The King's University", country: "Canada" },
{ instituteName: "Lakehead University", country: "Canada" },
{ instituteName: "Lakeland College", country: "Canada" },
{ instituteName: "Lasalle College", country: "Canada" },
{ instituteName: "Loyalist College", country: "Canada" },
{ instituteName: "Mount Allison University", country: "Canada" },
{ instituteName: "Niagara College", country: "Canada" },
{ instituteName: "Nipissing University", country: "Canada" },
{ instituteName: "Northern Lights College", country: "Canada" },
{ instituteName: "Northeastern University", country: "Canada" },
{ instituteName: "NorQuest College", country: "Canada" },
{ instituteName: "Olds College of Agriculture and Technology", country: "Canada" },
{ instituteName: "Ontario Tech University", country: "Canada" },
{ instituteName: "Queen's University", country: "Canada" },
{ instituteName: "Toronto Metropolitan University (Formerly; Ryerson University)", country: "Canada" },
{ instituteName: "Toronto Metropolitan University International College (Formerly, Ryerson University International College) to Toronto Metropolitan University", country: "Canada" },
{ instituteName: "Saskatchewan Polytechnic", country: "Canada" },
{ instituteName: "Selkirk College", country: "Canada" },
{ instituteName: "Seneca College", country: "Canada" },
{ instituteName: "Sheridan College", country: "Canada" },
{ instituteName: "Southern Alberta Institute of Technology (SAIT)", country: "Canada" },
{ instituteName: "Suncrest College", country: "Canada" },
{ instituteName: "Sir Wilfrid Laurier School Board", country: "Canada" },
{ instituteName: "St. Francis Xavier University", country: "Canada" },
{ instituteName: "St. Lawrence College", country: "Canada" },
{ instituteName: "St. Thomas University", country: "Canada" },
{ instituteName: "St. Lawrence College - Alpha College of Business & Technology", country: "Canada" },
{ instituteName: "Thompson Rivers University", country: "Canada" },
{ instituteName: "Fleming College, Toronto", country: "Canada" },
{ instituteName: "Trent University", country: "Canada" },
{ instituteName: "University of Alberta", country: "Canada" },
{ instituteName: "University Canada West", country: "Canada" },
{ instituteName: "University of the Fraser Valley", country: "Canada" },
{ instituteName: "University of Guelph", country: "Canada" },
{ instituteName: "University of Lethbridge", country: "Canada" },
{ instituteName: "University of Manitoba", country: "Canada" },
{ instituteName: "University of Niagara Falls", country: "Canada" },
{ instituteName: "University of New Brunswick", country: "Canada" },
{ instituteName: "University of Northern British Columbia (UNBC)", country: "Canada" },
{ instituteName: "University of Victoria", country: "Canada" },
{ instituteName: "University of Waterloo", country: "Canada" },
{ instituteName: "University of Windsor", country: "Canada" },
{ instituteName: "Vancouver Community College", country: "Canada" },
{ instituteName: "Vancouver Island University", country: "Canada" },
{ instituteName: "Wilfrid Laurier International College to Wilfrid Laurier University", country: "Canada" }
    
];

async function insertInstitutes() {
  try {
    // Connect to the database
    await connectDb();

    // Insert data into the database
    await Institute.insertMany(instituteData);
    console.log('Institutes inserted successfully!');
  } catch (error) {
    console.error('Error inserting institutes:', error);
  } finally {
    // Disconnect from the database
    mongoose.connection.close();
  }
}

insertInstitutes();