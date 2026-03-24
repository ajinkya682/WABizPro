import React, { useEffect, useState } from 'react';
import useContactStore from '../store/contactStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { Search, Plus, Trash2, Edit, AlertCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const Contacts = () => {
  const { contacts, total, isLoading, fetchContacts, createContact, deleteContact } = useContactStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', tags: '', optIn: true });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchContacts(search ? { search } : {});
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search, fetchContacts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name || !formData.phone) {
      setFormError('Name and phone are required');
      return;
    }
    const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const res = await createContact({ ...formData, tags: tagsArray });
    if (res.success) {
      toast.success('Contact added successfully');
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', tags: '', optIn: true });
    } else {
      setFormError(res.message);
      toast.error(res.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      const res = await deleteContact(id);
      if (res.success) toast.success('Contact deleted');
      else toast.error(res.message);
    }
  };

  const columns = [
    { header: 'Name', cell: (row) => <div className="font-medium text-text-primary">{row.name}</div> },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Tags', cell: (row) => (
      <div className="flex gap-1 flex-wrap">
        {row.tags?.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}
      </div>
    )},
    { header: 'Status', cell: (row) => (
      <Badge variant={row.optIn ? 'success' : 'danger'}>{row.optIn ? 'Opted In' : 'Opted Out'}</Badge>
    )},
    { header: 'Last Contacted', cell: (row) => (
      <span className="text-text-secondary text-xs">
        {row.lastContacted ? new Date(row.lastContacted).toLocaleDateString() : 'Never'}
      </span>
    )},
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <button className="p-1.5 text-text-secondary hover:text-primary transition-colors"><Edit size={16}/></button>
        <button onClick={() => handleDelete(row._id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors"><Trash2 size={16}/></button>
      </div>
    )},
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Contacts</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your customer database ({total} total)</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}><Plus size={18} /> Add Contact</Button>
      </div>

      <Card className="flex-1 flex flex-col p-6 min-h-0">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto border border-border rounded-lg relative">
          {isLoading && contacts.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50"><Spinner size="lg" /></div>
          ) : contacts.length > 0 ? (
            <Table columns={columns} data={contacts} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-full mb-4 text-gray-400">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-1">No contacts found</h3>
              <p className="text-sm text-text-secondary mb-4 max-w-sm">
                Get started by adding your first contact or import a CSV file to build your audience.
              </p>
              <Button onClick={() => setIsModalOpen(true)} variant="outline"><Plus size={18} /> Add Contact</Button>
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Contact">
        {formError && (
          <div className="bg-danger/10 text-danger px-3 py-2 rounded mb-4 flex gap-2 items-center text-sm">
            <AlertCircle size={16} /> {formError}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Full Name *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" required />
          <Input label="Phone Number *" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1234567890" required />
          <Input label="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
          <Input label="Tags (comma separated)" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="VIP, lead, newsletter" />
          
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input type="checkbox" checked={formData.optIn} onChange={e => setFormData({...formData, optIn: e.target.checked})} className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
            <span className="text-sm font-medium text-text-primary">Contact has opted in to receive messages</span>
          </label>
          
          <div className="flex justify-end gap-3 pt-4 pb-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Contact</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Contacts;
