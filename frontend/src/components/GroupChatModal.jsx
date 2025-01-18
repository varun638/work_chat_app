import { useState, useEffect } from 'react';
import { X, UserMinus, LogOut } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import toast from 'react-hot-toast';

const GroupMembersModal = ({ isOpen, onClose, groupId }) => {
  const [members, setMembers] = useState([]);
  const { getGroupMembers, removeMember, exitGroup, selectedUser } = useChatStore();

  useEffect(() => {
    if (isOpen && groupId) {
      fetchMembers();
    }
  }, [isOpen, groupId]);

  const fetchMembers = async () => {
    try {
      const data = await getGroupMembers(groupId);
      setMembers(data);
    } catch (error) {
      toast.error('Failed to fetch members');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await removeMember(groupId, memberId);
      toast.success('Member removed successfully');
      fetchMembers();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleExitGroup = async () => {
    try {
      await exitGroup(groupId);
      toast.success('Left group successfully');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to exit group');
    }
  };

  if (!isOpen) return null;

  const isAdmin = selectedUser?.admin?._id === members.find(m => m.isAdmin)?._id;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg w-[95%] max-w-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Group Members</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {members.map((member) => (
            <div
              key={member._id}
              className="flex items-center justify-between p-3 hover:bg-base-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.profilepic || "/avatar.png"}
                  alt={member.fullName}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{member.fullName}</p>
                  <p className="text-sm text-base-content/70">{member.email}</p>
                </div>
              </div>

              {isAdmin && member._id !== selectedUser?.admin?._id && (
                <button
                  onClick={() => handleRemoveMember(member._id)}
                  className="btn btn-ghost btn-sm btn-circle text-error"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {!isAdmin && (
          <button
            onClick={handleExitGroup}
            className="btn btn-error btn-sm mt-4 w-full gap-2"
          >
            <LogOut className="w-4 h-4" />
            Exit Group
          </button>
        )}
      </div>
    </div>
  );
};

export default GroupMembersModal;