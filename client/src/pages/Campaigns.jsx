import React, { useEffect, useState } from "react";
import useCampaignStore from "../store/campaignStore";
import api from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Rocket,
  Users,
  Target,
  Calendar,
} from "lucide-react";
import { toast } from "react-hot-toast";

const STATUS_COLORS = {
  draft: "secondary",
  scheduled: "warning",
  running: "primary",
  completed: "success",
  paused: "danger",
  failed: "danger",
};

const Campaigns = () => {
  const {
    campaigns,
    isLoading,
    fetchCampaigns,
    createCampaign,
    sendCampaign,
    deleteCampaign,
  } = useCampaignStore();
  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "broadcast",
    targetType: "all",
    segmentId: "",
    templateId: "",
    scheduledAt: "",
  });

  useEffect(() => {
    fetchCampaigns(filter !== "all" ? { status: filter } : {});
  }, [filter, fetchCampaigns]);

  useEffect(() => {
    if (isModalOpen) {
      api
        .get("/segments")
        .then((r) => setSegments(r.data.segments))
        .catch(console.error);
      api
        .get("/templates")
        .then((r) =>
          setTemplates(
            (r.data.templates || []).filter(
              (template) => !["REJECTED", "PAUSED"].includes(template.status),
            ),
          ),
        )
        .catch(console.error);
    }
  }, [isModalOpen]);

  const handleCreate = async () => {
    if (!formData.name || !formData.templateId) {
      toast.error("Name and Template are required");
      return;
    }
    const res = await createCampaign(formData);
    if (res.success) {
      toast.success("Campaign Draft Created!");
      setIsModalOpen(false);
      setStep(1);
      setFormData({
        name: "",
        description: "",
        type: "broadcast",
        targetType: "all",
        segmentId: "",
        templateId: "",
        scheduledAt: "",
      });
    } else {
      toast.error(res.message);
    }
  };

  const handleLaunch = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to launch this campaign? Messages will be sent immediately.",
      )
    ) {
      const res = await sendCampaign(id);
      if (res.success) toast.success("Campaign launched successfully! 🚀");
      else toast.error(res.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this campaign?")) {
      const res = await deleteCampaign(id);
      if (res.success) toast.success("Deleted");
      else toast.error(res.message);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Campaigns</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage and track your messaging campaigns
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Campaign
        </Button>
      </div>

      <div className="flex border-b border-border gap-6">
        {["all", "draft", "scheduled", "running", "completed", "paused"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${filter === tab ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      <div className="flex-1 overflow-auto min-h-0 relative">
        {isLoading && campaigns.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {campaigns.map((c) => (
              <Card
                key={c._id}
                className="p-5 flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <Badge
                    variant={STATUS_COLORS[c.status]}
                    className="capitalize"
                  >
                    {c.status}
                  </Badge>
                  <div className="flex gap-1 border border-border rounded-lg bg-gray-50">
                    {c.status === "draft" && (
                      <button
                        onClick={() => handleLaunch(c._id)}
                        className="p-2 text-primary hover:bg-white rounded-l-lg"
                        title="Launch"
                      >
                        <Play size={16} fill="currentColor" />
                      </button>
                    )}
                    {c.status === "running" && (
                      <button
                        className="p-2 text-warning hover:bg-white rounded-l-lg"
                        title="Pause"
                      >
                        <Pause size={16} fill="currentColor" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-2 text-danger hover:bg-white rounded-r-lg"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-text-primary mb-1 truncate">
                  {c.name}
                </h3>
                <p className="text-sm text-text-secondary mb-4 line-clamp-2 min-h-[40px]">
                  {c.templateId?.name || "No template selected"}
                </p>

                <div className="grid grid-cols-3 gap-2 mt-auto p-3 bg-bg rounded-lg text-center text-xs">
                  <div>
                    <span className="block text-lg font-bold text-text-primary">
                      {c.stats?.sent || 0}
                    </span>
                    <span className="text-text-secondary">Sent</span>
                  </div>
                  <div>
                    <span className="block text-lg font-bold text-success">
                      {c.stats?.delivered || 0}
                    </span>
                    <span className="text-text-secondary">Delivered</span>
                  </div>
                  <div>
                    <span className="block text-lg font-bold text-primary">
                      {c.stats?.read || 0}
                    </span>
                    <span className="text-text-secondary">Read</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-full mb-4 text-primary">
              <Rocket size={32} />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">
              No campaigns found
            </h3>
            <p className="text-sm text-text-secondary mb-4 max-w-sm">
              Create a new campaign to send messages to your audience.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> New Campaign
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setStep(1);
        }}
        title={`Create Campaign - Step ${step} of 3`}
      >
        <div className="space-y-6">
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${step >= i ? "bg-primary" : "bg-gray-200"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <Input
                label="Campaign Name *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Summer Sale Promo"
              />
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Internal notes"
              />
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">
                  Campaign Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() =>
                      setFormData({ ...formData, type: "broadcast" })
                    }
                    className={`p-3 border rounded-lg cursor-pointer flex gap-3 items-center ${formData.type === "broadcast" ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <Rocket
                      className={
                        formData.type === "broadcast"
                          ? "text-primary"
                          : "text-gray-400"
                      }
                    />
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        Broadcast
                      </div>
                      <div className="text-xs text-text-secondary">
                        Send immediately
                      </div>
                    </div>
                  </div>
                  <div
                    onClick={() =>
                      setFormData({ ...formData, type: "scheduled" })
                    }
                    className={`p-3 border rounded-lg cursor-pointer flex gap-3 items-center ${formData.type === "scheduled" ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <Calendar
                      className={
                        formData.type === "scheduled"
                          ? "text-primary"
                          : "text-gray-400"
                      }
                    />
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        Scheduled
                      </div>
                      <div className="text-xs text-text-secondary">
                        Send later
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {formData.type === "scheduled" && (
                <Input
                  label="Schedule Time"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">
                  Target Audience
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div
                    onClick={() =>
                      setFormData({ ...formData, targetType: "all" })
                    }
                    className={`p-3 border rounded-lg cursor-pointer flex gap-3 items-center ${formData.targetType === "all" ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <Users
                      className={
                        formData.targetType === "all"
                          ? "text-primary"
                          : "text-gray-400"
                      }
                    />
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        All Contacts
                      </div>
                    </div>
                  </div>
                  <div
                    onClick={() =>
                      setFormData({ ...formData, targetType: "segment" })
                    }
                    className={`p-3 border rounded-lg cursor-pointer flex gap-3 items-center ${formData.targetType === "segment" ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <Target
                      className={
                        formData.targetType === "segment"
                          ? "text-primary"
                          : "text-gray-400"
                      }
                    />
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        Segment
                      </div>
                    </div>
                  </div>
                </div>
                {formData.targetType === "segment" && (
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-1.5 block">
                      Select Segment
                    </label>
                    <select
                      value={formData.segmentId}
                      onChange={(e) =>
                        setFormData({ ...formData, segmentId: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-border rounded-lg outline-none focus:border-primary"
                    >
                      <option value="">-- Choose a segment --</option>
                      {segments.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.contactCount} contacts)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">
                  Message Template
                </label>
                {templates.length === 0 ? (
                  <div className="p-4 bg-warning/10 text-warning rounded-lg text-sm">
                    No active templates found. Please create a template first.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                    {templates.map((t) => (
                      <div
                        key={t._id}
                        onClick={() =>
                          setFormData({ ...formData, templateId: t._id })
                        }
                        className={`p-4 border rounded-lg cursor-pointer ${formData.templateId === t._id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-gray-300"}`}
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-text-primary text-sm">
                            {t.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {t.category}
                            </Badge>
                            <Badge
                              variant={
                                t.status === "APPROVED" ? "success" : "warning"
                              }
                              className="text-[10px]"
                            >
                              {t.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2 bg-white p-2 border border-gray-100 rounded">
                          {t.components.find((c) => c.type === "BODY")?.text ||
                            "No body text"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 mt-8 border-t border-border">
            <Button
              variant="ghost"
              onClick={() =>
                step > 1 ? setStep(step - 1) : setIsModalOpen(false)
              }
            >
              {step > 1 ? "Back" : "Cancel"}
            </Button>
            <Button
              onClick={() => (step < 3 ? setStep(step + 1) : handleCreate())}
            >
              {step < 3 ? "Continue" : "Create Draft"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default Campaigns;
