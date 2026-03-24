import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Plus, Trash2, FileText, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: 'MARKETING', language: 'en', headerText: '', bodyText: '', footerText: '' });

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data.templates);
    } catch (err) { toast.error('Failed to load templates'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const components = [];
      if (formData.headerText) components.push({ type: 'HEADER', format: 'TEXT', text: formData.headerText });
      if (formData.bodyText) components.push({ type: 'BODY', text: formData.bodyText });
      if (formData.footerText) components.push({ type: 'FOOTER', text: formData.footerText });
      
      const payload = {
        name: formData.name.toLowerCase().replace(/\\s+/g, '_'),
        category: formData.category,
        language: formData.language,
        components
      };
      
      await api.post('/templates', payload);
      toast.success('Template created and ready to use');
      setIsModalOpen(false);
      setFormData({ name: '', category: 'MARKETING', language: 'en', headerText: '', bodyText: '', footerText: '' });
      fetchTemplates();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create template'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this template?')) {
      try {
        await api.delete(`/templates/${id}`);
        setTemplates(ts => ts.filter(t => t._id !== id));
        toast.success('Deleted');
      } catch (err) { toast.error('Failed to delete'); }
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Templates</h1>
          <p className="text-sm text-text-secondary mt-1">Manage WhatsApp message templates</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}><Plus size={18} /> New Template</Button>
      </div>

      <div className="flex-1 overflow-auto min-h-0 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center"><Spinner size="lg" /></div>
        ) : templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
            {templates.map(t => (
              <Card key={t._id} className="flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border bg-gray-50 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">{t.name}</h3>
                    <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                  </div>
                  <Badge variant={t.status === 'APPROVED' ? 'success' : t.status === 'REJECTED' ? 'danger' : 'warning'} className="text-[10px]">
                    {t.status}
                  </Badge>
                </div>
                <div className="p-4 flex-1 bg-[#ECE5DD] relative min-h-[150px]">
                  <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm inline-block max-w-[90%] relative">
                    <div className="absolute top-0 -left-2 w-0 h-0 border-[8px] border-transparent border-t-white border-r-white"></div>
                    {t.components.find(c => c.type === 'HEADER')?.text && <p className="font-bold text-sm mb-1">{t.components.find(c => c.type === 'HEADER').text}</p>}
                    <p className="text-sm whitespace-pre-wrap text-gray-800">{t.components.find(c => c.type === 'BODY')?.text || 'No content'}</p>
                    {t.components.find(c => c.type === 'FOOTER')?.text && <p className="text-xs text-gray-500 mt-2">{t.components.find(c => c.type === 'FOOTER').text}</p>}
                    <div className="text-[10px] text-gray-400 text-right mt-1">12:00 PM</div>
                  </div>
                </div>
                <div className="p-3 border-t border-border bg-white flex justify-end">
                  <button onClick={() => handleDelete(t._id)} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-full mb-4 text-primary">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">No templates found</h3>
            <p className="text-sm text-text-secondary mb-4 max-w-sm">Create pre-approved message templates to send broadcasts to your customers.</p>
            <Button onClick={() => setIsModalOpen(true)}><Plus size={18} /> New Template</Button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Message Template">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleCreate} id="template-form" className="space-y-4">
            <Input label="Template Name *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toLowerCase().replace(/\\s+/g, '_')})} placeholder="e.g. welcome_message" required 
                   className="font-mono text-sm" />
            
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary">
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>
            </div>

            <Input label="Header (Optional)" value={formData.headerText} onChange={e => setFormData({...formData, headerText: e.target.value})} placeholder="Bold title" />
            
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Body Text *</label>
              <textarea 
                value={formData.bodyText} 
                onChange={e => setFormData({...formData, bodyText: e.target.value})} 
                placeholder="Message body (use {{1}}, {{2}} for variables)"
                className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary min-h-[120px] resize-y"
                required
              />
            </div>

            <Input label="Footer (Optional)" value={formData.footerText} onChange={e => setFormData({...formData, footerText: e.target.value})} placeholder="Small gray text at bottom" />
          </form>

          <div className="bg-[#ECE5DD] p-6 rounded-xl border border-border flex items-center justify-center relative overflow-hidden min-h-[400px]">
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 shadow-sm border border-white/40">
              <Smartphone size={14} /> Live Preview
            </div>
            
            <div className="w-full max-w-[280px]">
              {formData.bodyText ? (
                <div className="bg-white rounded-xl rounded-tl-none p-4 shadow-md relative">
                  <div className="absolute top-0 -left-2 w-0 h-0 border-[10px] border-transparent border-t-white border-r-white"></div>
                  {formData.headerText && <p className="font-bold text-[15px] mb-2">{formData.headerText}</p>}
                  <p className="text-[14.5px] leading-[1.35] whitespace-pre-wrap text-[#111B21]">{formData.bodyText}</p>
                  {formData.footerText && <p className="text-[11px] text-[#667781] mt-2">{formData.footerText}</p>}
                  <div className="text-[10px] text-gray-400 text-right mt-1.5 pt-1 border-t border-gray-100 uppercase tracking-widest flex justify-end items-center gap-1">
                    12:00 PM <span className="text-blue-500">✓✓</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm bg-white/50 p-4 rounded-xl border border-white">
                  Type something to see preview
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="template-form">Create Template</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Templates;
