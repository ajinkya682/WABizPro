import React, { useEffect, useState } from 'react';
import { Filter, Plus, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

const defaultFilter = { field: 'tags', operator: 'contains', value: '' };

const Segments = () => {
  const [segments, setSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logicOperator: 'AND',
    filters: [defaultFilter],
  });

  const fetchSegments = async () => {
    try {
      const res = await api.get('/segments');
      setSegments(res.data.segments || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load segments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const updateFilter = (index, key, value) => {
    setFormData((prev) => ({
      ...prev,
      filters: prev.filters.map((filter, filterIndex) =>
        filterIndex === index ? { ...filter, [key]: value } : filter
      ),
    }));
  };

  const addFilter = () => {
    setFormData((prev) => ({ ...prev, filters: [...prev.filters, defaultFilter] }));
  };

  const removeFilter = (index) => {
    setFormData((prev) => ({
      ...prev,
      filters: prev.filters.filter((_, filterIndex) => filterIndex !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      logicOperator: 'AND',
      filters: [defaultFilter],
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const filters = formData.filters.filter((filter) => filter.value?.toString().trim());
    try {
      const res = await api.post('/segments', { ...formData, filters });
      setSegments((prev) => [res.data.segment, ...prev]);
      toast.success('Segment created');
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create segment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this segment?')) return;

    try {
      await api.delete(`/segments/${id}`);
      setSegments((prev) => prev.filter((segment) => segment._id !== id));
      toast.success('Segment deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete segment');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Segments</h1>
          <p className="text-sm text-text-secondary mt-1">
            Group contacts by tags, opt-in status, and engagement rules
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Segment
        </Button>
      </div>

      <Card className="flex-1 p-6 relative min-h-0 overflow-auto">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : segments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {segments.map((segment) => (
              <Card key={segment._id} className="p-5 border border-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{segment.name}</h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {segment.description || 'Dynamic audience based on your saved rules.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(segment._id)}
                    className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    title="Delete segment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="primary">{segment.logicOperator}</Badge>
                  <Badge variant="secondary">{segment.filters?.length || 0} filters</Badge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs uppercase tracking-wide text-text-secondary">Contacts</div>
                    <div className="text-2xl font-bold text-text-primary mt-1">
                      {segment.contactCount || 0}
                    </div>
                  </div>
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs uppercase tracking-wide text-text-secondary">Updated</div>
                    <div className="text-sm font-medium text-text-primary mt-2">
                      {segment.lastRefreshed
                        ? new Date(segment.lastRefreshed).toLocaleDateString()
                        : 'Not yet'}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full mb-4 text-primary">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">No segments yet</h3>
            <p className="text-sm text-text-secondary mb-4 max-w-sm">
              Create audience rules so campaigns can target the right contacts automatically.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Create Segment
            </Button>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Segment">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Segment Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VIP Customers"
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="People tagged as VIP and opted in"
          />

          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">
              Match Logic
            </label>
            <select
              value={formData.logicOperator}
              onChange={(e) => setFormData({ ...formData, logicOperator: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary"
            >
              <option value="AND">All rules must match</option>
              <option value="OR">Any rule can match</option>
            </select>
          </div>

          <div className="space-y-3">
            {formData.filters.map((filter, index) => (
              <div key={`${filter.field}-${index}`} className="border border-border rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-1.5 block">
                      Field
                    </label>
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(index, 'field', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary"
                    >
                      <option value="tags">Tag</option>
                      <option value="optIn">Opt-in Status</option>
                      <option value="lastContacted">Last Contacted</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-primary mb-1.5 block">
                      Operator
                    </label>
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary"
                    >
                      <option value="contains">Contains</option>
                      <option value="not_contains">Does not contain</option>
                      <option value="gt">After</option>
                      <option value="lt">Before</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-primary mb-1.5 block">
                      Value
                    </label>
                    <input
                      value={filter.value}
                      onChange={(e) => updateFilter(index, 'value', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary"
                      placeholder={filter.field === 'lastContacted' ? '2026-03-01' : 'VIP'}
                    />
                  </div>
                </div>

                {formData.filters.length > 1 && (
                  <div className="flex justify-end mt-3">
                    <Button type="button" variant="ghost" onClick={() => removeFilter(index)}>
                      <Trash2 size={16} /> Remove rule
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={addFilter}>
              <Filter size={16} /> Add Rule
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Segment</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Segments;
