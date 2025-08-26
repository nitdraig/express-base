// middlewares/studentAuthorization.ts
import { Request, Response, NextFunction } from "express";

import { IUser } from "../../domain/users/models/userModels";
import { Admin } from "../../domain/roles/admin/models/adminModels";
import { Student } from "../../domain/roles/students/models/studentsModel";

export const authorizeStudentAction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as IUser;
    const userId = user.id;

    // Si es estudiante y actúa sobre su propio perfil
    if (user.role === "student") {
      const student = await Student.findOne({ user: userId });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Perfil de estudiante no encontrado",
        });
      }
      //   req.student = student; // opcional si querés pasarlo al controlador
      return next();
    }

    // Si es admin: necesita estar asignado a una escuela
    if (user.role === "admin") {
      const admin = await Admin.findOne({ user: userId });
      if (!admin || !admin.school) {
        return res
          .status(403)
          .json({ success: false, message: "Admin sin escuela asignada" });
      }

      const student = await Student.findOne({
        ...(req.params.studentId
          ? { _id: req.params.studentId }
          : { user: req.body.userId || userId }),
      }).populate("school");

      if (!student || !student.school) {
        return res.status(404).json({
          success: false,
          message: "Estudiante no encontrado o sin escuela",
        });
      }

      if (admin.school.toString() !== student.school._id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "No autorizado para esta acción" });
      }

      return next();
    }

    return res
      .status(403)
      .json({ success: false, message: "Rol no autorizado" });
  } catch (error) {
    console.error("Error en autorización de estudiante:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error interno de autorización" });
  }
};
