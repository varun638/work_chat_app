import { useState } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import toast from 'react-hot-toast';

const GroupChatModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { users, createGroup } = useChatStore();

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedUsers.find(selected => selected._id === user._id)
  );

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      return toast.error('Please enter a group name');
    }
    if (selectedUsers.length < 2) {
      return toast.error('Please select at least 2 members');
    }

    try {
      await createGroup({
        name: groupName,
        members: selectedUsers.map(user => user._id)
      });
      onClose();
      setGroupName('');
      setSelectedUsers([]);
      toast.success('Group created successfully!');
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg w-[95%] max-w-md p-4">
        <div className="flex items-center justify-between mb-4">
          {/* Header with # group name */}
          <h2 className="text-lg font-semibold">
            {groupName ? `# ${groupName}` : 'Create Group Chat'}
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="text"
          placeholder="Group Name"
          className="input input-bordered w-full mb-4"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <div className="flex flex-wrap gap-2 mb-4">
          {selectedUsers.map(user => (
            <div 
              key={user._id}
              className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2"
            >
              <span>{user.fullName}</span>
              <button 
                onClick={() => setSelectedUsers(prev => prev.filter(u => u._id !== user._id))}
                className="hover:text-primary/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search users..."
            className="input input-bordered w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="max-h-48 overflow-y-auto mb-4 space-y-2">
          {filteredUsers.map(user => (
            <button
              key={user._id}
              onClick={() => setSelectedUsers(prev => [...prev, user])}
              className="flex items-center gap-3 w-full p-2 hover:bg-base-200 rounded-lg transition-colors"
            >
              <span className="flex-1 text-left">{user.fullName}</span>
              <Plus className="w-4 h-4" />
            </button>
          ))}
        </div>

        <button 
          className="btn btn-primary w-full"
          onClick={handleCreateGroup}
        >
          Create Group
        </button>
      </div>
    </div>
  );
};

export default GroupChatModal;