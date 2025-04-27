import {
  FileIcon,
  FileJsonIcon,
  FileTextIcon,
  FileTypeIcon,
  FileCodeIcon,
  ImageIcon,
} from "lucide-react";

export function getFileIcon(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return FileCodeIcon;
    case "json":
      return FileJsonIcon;
    case "md":
    case "txt":
      return FileTextIcon;
    case "css":
    case "scss":
    case "less":
      return FileTypeIcon;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return ImageIcon;
    default:
      return FileIcon;
  }
}
