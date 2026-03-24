import React, { useEffect, useState } from "react";
import api from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Table from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import Modal from "../components/ui/Modal";
import { Plus, Trash2, Bot, Power } from "lucide-react";
import toast from "react-hot-toast";

const Chatbot = () => {
  const [bots, setBots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    triggerKeyword: "",
    triggerMatches: "exact",
    isActive: true,
    replyType: "text",
    replyText: "",
  });

  const fetchBots = async () => {
    try {
      const res = await api.get("/chatbots");
      setBots(res.data.bots || []);
    } catch (err) {
      toast.error("Failed to load chatbots");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (
        !formData.name ||
        !formData.triggerKeyword ||
        (!formData.replyText && formData.replyType === "text")
      ) {
        return toast.error("Please fill required fields");
      }

      const payload = {
        ...formData,
        actions: [{ type: "send_message", content: formData.replyText }],
      };
      await api.post("/chatbots", payload);
      toast.success("Chatbot rule created");
      setIsModalOpen(false);
      setFormData({
        name: "",
        triggerKeyword: "",
        triggerMatches: "exact",
        isActive: true,
        replyType: "text",
        replyText: "",
      });
      fetchBots();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create chatbot");
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await api.put(`/chatbots/${id}`, { isActive: !isActive });
      setBots((bs) =>
        bs.map((b) => (b._id === id ? { ...b, ...(b._id === id ? { isActive: !isActive } : {}) } : b)),
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this rule?")) {
      try {
        await api.delete(`/chatbots/${id}`);
        setBots((bs) => bs.filter((b) => b._id !== id));
        toast.success("Deleted");
      } catch (err) {
        toast.error("Failed to delete");
      }
    }
  };

  const columns = [
    {
      header: "Bot Name",
      cell: (row) => <div className="font-bold">{row.name}</div>,
    },
    {
      header: "Trigger Keyword",
      cell: (row) => (
        <div>
          <span className="bg-gray-100 font-mono text-xs px-2 py-1 rounded border border-border">
            "{row.triggerKeyword || row.keywords?.[0] || "-"}"
          </span>{" "}
          <span className="text-xs text-text-secondary">
            ({row.triggerMatches || "exact"})
          </span>
        </div>
      ),
    },
    {
      header: "Action",
      cell: (row) => (
        <div className="text-sm truncate max-w-[200px]">
          {row.actions?.[0]?.content || row.replyText || row.fallbackMessage || "Template"}
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isActive ? "success" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleToggle(row._id, row.isActive)}
            className={`p-1.5 rounded transition-colors ${row.isActive ? "text-danger hover:bg-danger/10" : "text-success hover:bg-success/10"}`}
          >
            <Power size={18} />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger/10 rounded transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Chatbot Auto-Replies
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Automate responses based on customer keywords
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Rule
        </Button>
      </div>

      <Card className="flex-1 p-6 relative min-h-0 overflow-auto">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : bots.length > 0 ? (
          <Table columns={columns} data={bots} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full mb-4 text-primary">
              <Bot size={32} />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">
              No chatbot rules
            </h3>
            <p className="text-sm text-text-secondary mb-4 max-w-sm">
              Create rules to auto-reply to customers 24/7 based on keywords.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> New Rule
            </Button>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Auto-Reply Rule"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Rule Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Greeting"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Keyword *"
              value={formData.triggerKeyword}
              onChange={(e) =>
                setFormData({ ...formData, triggerKeyword: e.target.value })
              }
              placeholder="e.g. hi, hello, pricing"
              required
            />
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">
                Match Type
              </label>
              <select
                value={formData.triggerMatches}
                onChange={(e) =>
                  setFormData({ ...formData, triggerMatches: e.target.value })
                }
                className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary"
              >
                <option value="exact">Exact Word</option>
                <option value="contains">Contains Word</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">
              Reply Message *
            </label>
            <textarea
              value={formData.replyText}
              onChange={(e) =>
                setFormData({ ...formData, replyText: e.target.value })
              }
              placeholder="Type automatic response here..."
              className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary min-h-[100px] resize-y"
              required
            />
          </div>

          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="rounded text-primary focus:ring-primary w-4 h-4"
            />
            <span className="text-sm font-medium">Activate immediately</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Rule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Chatbot;
