import {
  BookOpen, FileText, Mic, ImageUp, Clapperboard, Smartphone, FolderKanban, Download, LayoutDashboard,
} from "lucide-react";

export const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, desc: "Overview" },
  { title: "AI Story Generator", url: "/story", icon: BookOpen, desc: "Turn an idea into a story" },
  { title: "AI Script Generator", url: "/script", icon: FileText, desc: "Write a video script" },
  { title: "Telugu AI Voice", url: "/voice", icon: Mic, desc: "Telugu voice-over from text" },
  { title: "Image Upload", url: "/upload", icon: ImageUp, desc: "Add images for your video" },
  { title: "Image to Video", url: "/image-to-video", icon: Clapperboard, desc: "Animate images into video" },
  { title: "Shorts Maker (9:16)", url: "/shorts", icon: Smartphone, desc: "Vertical YouTube Shorts" },
  { title: "My Projects", url: "/projects", icon: FolderKanban, desc: "Your saved work" },
  { title: "Download Videos", url: "/downloads", icon: Download, desc: "Rendered videos" },
] as const;
