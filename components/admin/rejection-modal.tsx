import { ApprovalModal } from "@/components/admin/approval-modal";

export function RejectionModal({ open, appointmentId, onClose, onComplete }: { open: boolean; appointmentId: string; onClose: () => void; onComplete: (message: string) => void }) {
  return <ApprovalModal open={open} appointmentId={appointmentId} action="reject" onClose={onClose} onComplete={onComplete} />;
}
