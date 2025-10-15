// Re-export the toast functions from the .tsx version
// This ensures compatibility with existing imports
import { useToast, toast } from './use-toast.tsx';
export { useToast, toast };
export default useToast;