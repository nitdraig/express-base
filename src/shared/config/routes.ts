import { Router } from "express";

import schoolsRoutes from "./../../domain/schools/routes/schoolsRoutes";
import authRoutes from "./../../domain/auth/routes/authRoutes";
import studentsRoutes from "./../../domain/roles/students/routes/studentsRoutes";
import notificationRoutes from "./../../domain/management/notifications/routes/notificationsRoutes";
import userRoutes from "./../../domain/users/routes/userRoutes";
import chatbotRoutes from "./../../domain/chatbot/routes/chatbotRoutes";
import teachersRoutes from "./../../domain/roles/teachers/routes/teachersRoutes";
import tutorRoutes from "./../../domain/roles/tutors/routes/tutorRoutes";
import adminRoutes from "./../../domain/roles/admin/routes/adminRoutes";
import documentRoutes from "./../../domain/management/documents/routes/documentRoutes";
import forumRoutes from "./../../domain/academics/forums/routes/forumRoutes";
import coursesRoutes from "./../../domain/academics/courses/routes/coursesRoutes";
import careerRoutes from "./../../domain/academics/career/routes/careerRoutes";
import moduleRoutes from "./../../domain/academics/module/routes/moduleRoutes";
import subjectRoutes from "./../../domain/academics/subject/routes/subjectRoutes";
import superAdminRoutes from "./../../domain/roles/superAdmin/routes/superAdminRoutes";

export const registerRoutes = (app: Router): void => {
  app.use("/auth", authRoutes);
  app.use("/students", studentsRoutes);
  app.use("/personas", chatbotRoutes);
  app.use("/courses", coursesRoutes);
  app.use("/teachers", teachersRoutes);
  app.use("/schools", schoolsRoutes);
  app.use("/tutors", tutorRoutes);
  app.use("/admin", adminRoutes);
  app.use("/documents", documentRoutes);
  app.use("/users", userRoutes);
  app.use("/notifications", notificationRoutes);
  app.use("/superAdmin", superAdminRoutes);
  app.use("/forum", forumRoutes);
  app.use("/careers", careerRoutes);
  app.use("/modules", moduleRoutes);
  app.use("/subjects", subjectRoutes);
};
