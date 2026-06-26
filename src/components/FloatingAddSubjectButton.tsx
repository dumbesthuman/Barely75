import { motion } from "framer-motion";
import { PlusIcon } from "./Icons";

interface FloatingAddSubjectButtonProps {
  onClick: () => void;
}

export const FloatingAddSubjectButton = ({ onClick }: FloatingAddSubjectButtonProps) => (
  <motion.button
    type="button"
    className="fab-button focus-ring"
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    aria-label="Add subject"
  >
    <PlusIcon className="h-5 w-5" />
    <span className="hidden sm:inline">Add Subject</span>
  </motion.button>
);
