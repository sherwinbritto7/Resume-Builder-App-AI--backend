import openai from "../configs/ai.js";
import Resume from "../models/Resume.js";

//controller for enhancing a resume's professional summary
//POST: /api/ai/enhance-pro-sum
export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert in resume writing. Enhance the professional summary in 1-2 sentences, highlighting key skills, experience, and career objectives. Return only the text, no options or JSON.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const enhancedContent = response.choices?.[0]?.message?.content;

    if (!enhancedContent) {
      return res.status(500).json({ message: "AI did not return any content" });
    }

    return res.status(200).json({ enhancedContent });
  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

//Controller for enhancing a resumes's job description
//POST: /api/ai/enhance-job-desc
export const enhancejobDescription = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert in resume writing. Your task is to enhance the job description of a resume. The job description should be of 1-2 sentences also highlighting key responsibilities and achievements. Use action verbs and quantifiable results where possible. Make it ATS-friendly and only return text no option oor anything else.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });
    const enhancedContent = response.choices[0].message.content;
    return res.status(200).json({ enhancedContent });
  } catch (error) {
    console.error("AI ERROR:", error);
    return res.status(500).json({
      message: error.message || "AI enhancement failed",
    });
  }
};

//contoller for uploading a resume to database
//POST: /api/ai/upload-resume

// export const uploadResume = async (req, res) => {
//   try {
//     const { resumeText, title } = req.body;
//     const userId = req.userId;

//     if (!resumeText) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const systemPrompt =
//       "You are an expert AI Agent to extract data from resume.";

//     const userPrompt = `extract data from this resume: ${resumeText}

//     Provide data in the following JSON format with no additional text before or after:

//     {
//     professional_summary: { type: String, default: "" },
//     skills: [{ type: String }],
//     personal_info: {
//       image: { type: String, default: "" },
//       full_name: { type: String, default: "" },
//       profession: { type: String, default: "" },
//       email: { type: String, default: "" },
//       phone: { type: String, default: "" },
//       location: { type: String, default: "" },
//       linkedin: { type: String, default: "" },
//       website: { type: String, default: "" },
//     },
//     experience: [
//       {
//         company: { type: String },
//         position: { type: String },
//         start_date: { type: String },
//         end_date: { type: String },
//         description: { type: String },
//         is_current: { type: Boolean },
//       },
//     ],
//     projects: [
//       {
//         name: { type: String },
//         type: { type: String },
//         description: { type: String },
//       },
//     ],
//     education: [
//       {
//         institution: { type: String },
//         degree: { type: String },
//         field: { type: String },
//         graduation_date: { type: String },
//         gpa: { type: String },
//       },
//     ],
//     }
//     `;

//     const response = await ai.openai.chat.completions.create({
//       model: process.env.OPENAI_MODEL,
//       messages: [
//         {
//           role: "system",
//           content: systemPrompt,
//         },
//         {
//           role: "user",
//           content: userPrompt,
//         },
//       ],
//       response_format: { type: "json_object" },
//     });

//     const extractedData = response.choices[0].message.content;
//     const parsedData = JSON.parse(extractedData);
//     const newResume = await Resume.create({ userId, title, ...parsedData });

//     res.json({ resumeId: newResume._id });
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };

// Controller for uploading a resume
// POST: /api/ai/upload-resume
export const uploadResume = async (req, res) => {
  try {
    const { title, resumeText } = req.body;
    const userId = req.userId;

    if (!resumeText || !title) {
      return res.status(400).json({ message: "Title or resume text missing" });
    }

    // AI prompt for extracting structured resume data
    const systemPrompt =
      "You are an AI agent that extracts structured JSON data from resumes.";
    const userPrompt = `Extract data from this resume:
${resumeText}

Return ONLY valid JSON in this exact structure with NO explanations, NO extra text:

{
  professional_summary: { type: String, default: "" },
    skills: [{ type: String }],
    personal_info: {
      image: { type: String, default: "" },
      full_name: { type: String, default: "" },
      profession: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      location: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    experience: [
      {
        company: { type: String },
        position: { type: String },
        start_date: { type: String },
        end_date: { type: String },
        description: { type: String },
        is_current: { type: Boolean },
      },
    ],
    projects: [
      {
        name: { type: String },
        type: { type: String },
        description: { type: String },
      },
    ],
    education: [
      {
        institution: { type: String },
        degree: { type: String },
        field: { type: String },
        graduation_date: { type: String },
        gpa: { type: String },
      },
    ],
}`;

    let parsedData = null;
    let attempts = 0;

    while (attempts < 2 && !parsedData) {
      attempts++;

      // Call OpenAI
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      let aiData = response.choices[0].message.content.trim();

      // Keep only first JSON object
      const first = aiData.indexOf("{");
      const last = aiData.lastIndexOf("}");
      if (first >= 0 && last >= 0) {
        aiData = aiData.slice(first, last + 1);
      }

      try {
        parsedData = JSON.parse(aiData);
      } catch (err) {
        console.warn(`Attempt ${attempts} failed to parse AI JSON`);
        parsedData = null;
      }
    }

    if (!parsedData) {
      return res.status(400).json({
        message:
          "Failed to parse AI resume data after 2 attempts. Please try again.",
      });
    }

    // Sanitize data for MongoDB
    const sanitizedData = {
      professional_summary: parsedData.professional_summary || "",
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      personal_info: {
        image: parsedData.personal_info?.image || "",
        full_name: parsedData.personal_info?.full_name || "",
        profession: parsedData.personal_info?.profession || "",
        email: parsedData.personal_info?.email || "",
        phone: parsedData.personal_info?.phone || "",
        location: parsedData.personal_info?.location || "",
        linkedin: parsedData.personal_info?.linkedin || "",
        website: parsedData.personal_info?.website || "",
      },
      experience: Array.isArray(parsedData.experience)
        ? parsedData.experience
        : [],
      projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
      education: Array.isArray(parsedData.education)
        ? parsedData.education
        : [],
    };

    // Save to database
    let newResume;
    try {
      newResume = await Resume.create({ userId, title, ...sanitizedData });
    } catch (err) {
      console.error("Database insertion error:", err);
      return res
        .status(500)
        .json({ message: "Database error creating resume" });
    }

    return res.status(200).json({ resumeId: newResume._id });
  } catch (error) {
    console.error("Server error uploading resume:", error);
    return res.status(500).json({ message: "Server error uploading resume" });
  }
};
