'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NotificationCenter from '@/components/NotificationCenter';
import RichTextDisplay from '@/components/RichTextDisplay';
import { format } from 'date-fns';
import { announcementApi, passoverApi, publicApi, Announcement, Passover } from '@/lib/api';
import { Category } from '@/types';
import { useAuth } from '@/lib/auth';
import {
  Typography, Tabs, Input, Button, Card, Modal, Form,
  Tag, Space, Spin, Select, Empty, Image, Row, Col,
  Statistic, Dropdown, message, Avatar, Divider, Tooltip, List
} from 'antd';
import {
  SearchOutlined, PushpinFilled,
  MoreOutlined, DeleteOutlined, ContainerOutlined,
  MessageOutlined, UserOutlined, ClockCircleOutlined,
  SendOutlined, EditOutlined, PaperClipOutlined, CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

function HomePageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('announcements');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [passovers, setPassovers] = useState<Passover[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle URL parameters for tab and passoverId
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'passover' || tab === 'announcements') {
      setActiveTab(tab);
    }
    // Scroll to specific passover if passoverId is provided
    const passoverId = searchParams?.get('passoverId');
    if (passoverId && tab === 'passover') {
      setTimeout(() => {
        const element = document.getElementById(`passover-${passoverId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight effect could be added here
        }
      }, 500);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [activeCategory]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load categories
      const cats = await publicApi.getCategories();
      setCategories(cats);

      // Load announcements
      const anns = await announcementApi.getAnnouncements(
        activeCategory !== 'all' ? { categoryId: activeCategory } : {}
      );
      setAnnouncements(anns);

      // Load passovers
      const pass = await passoverApi.getPassovers();
      setPassovers(pass);
    } catch (error) {
      console.error('Failed to load data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  const filteredAnnouncements = announcements.filter((ann) => {
    if (activeCategory !== 'all' && ann.categoryId !== activeCategory) return false;
    if (searchQuery && !ann.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !ann.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return !ann.archivedAt;
  });

  const stickyAnnouncements = filteredAnnouncements.filter((ann) => ann.isSticky || ann.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter((ann) => !ann.isSticky && !ann.isPinned);

  // Calculate active announcements (not responded by ANY user)
  const activeAnnouncementsCount = announcements.filter((ann) => {
    if (ann.archivedAt) return false;
    return !ann.responses || ann.responses.length === 0;
  }).length;

  const stickyCount = announcements.filter((ann) => !ann.archivedAt && (ann.isSticky || ann.isPinned)).length;

  const items = [
    {
      key: 'announcements',
      label: 'Announcements',
      children: (
        <>
          {/* Stats Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={12} md={6}>
              <Card bordered={false} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Active</span>}
                  value={activeAnnouncementsCount}
                  valueStyle={{ color: 'white', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Sticky/Pinned</span>}
                  value={stickyCount}
                  valueStyle={{ color: 'white', fontWeight: 'bold' }}
                  prefix={<PushpinFilled style={{ opacity: 0.5, marginRight: 8 }} />}
                />
              </Card>
            </Col>
          </Row>

          {/* Search and Filter */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="middle">
            <Col xs={24} md={12}>
              <Search
                placeholder="Search announcements..."
                allowClear
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%' }}
                size="large"
              />
            </Col>
            <Col xs={24} md={12}>
              <Select
                value={activeCategory}
                onChange={setActiveCategory}
                style={{ width: '100%' }}
                size="large"
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map(c => ({ value: c.id, label: c.name }))
                ]}
              />
            </Col>
          </Row>

          {/* Sticky Announcements */}
          {stickyAnnouncements.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <Title level={4} style={{ marginBottom: 16 }}>
                <PushpinFilled style={{ color: '#f59e0b', marginRight: 8 }} />
                Sticky Announcements
              </Title>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {stickyAnnouncements.map((ann) => (
                  <AnnouncementCard key={ann.id} announcement={ann} onResponse={loadData} />
                ))}
              </Space>
            </div>
          )}

          {/* Regular Announcements */}
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>
              {activeCategory === 'all'
                ? 'All Announcements'
                : `${categories.find(cat => cat.id === activeCategory)?.name || 'Announcements'} Announcements`}
            </Title>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
              </div>
            ) : regularAnnouncements.length === 0 ? (
              <Empty description="No announcements found" />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {regularAnnouncements.map((ann) => (
                  <AnnouncementCard key={ann.id} announcement={ann} onResponse={loadData} />
                ))}
              </Space>
            )}
          </div>
        </>
      ),
    },
    {
      key: 'passover',
      label: 'Passover',
      children: (
        <div>
          <Title level={4} style={{ marginBottom: 16 }}>Passover Logs</Title>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : passovers.length === 0 ? (
            <Empty description="No passovers found" />
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {passovers.map((passover) => (
                <div key={passover.id} id={`passover-${passover.id}`}>
                  <PassoverCard passover={passover} onResponse={loadData} />
                </div>
              ))}
            </Space>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Home</Title>
          <Text type="secondary">{today}</Text>
        </div>
        <NotificationCenter />
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        size="large"
        type="card"
      />
    </div>
  );
}

// Response Modal Component
function ResponseModal({
  isOpen,
  onClose,
  onQuickResponse,
  onCustomResponse,
  responding,
  currentResponse
}: {
  isOpen: boolean;
  onClose: () => void;
  onQuickResponse: (response: string) => void;
  onCustomResponse: (response: string) => void;
  responding: boolean;
  currentResponse?: string;
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({ response: currentResponse || '' });
    }
  }, [isOpen, currentResponse, form]);

  const handleSubmit = (values: { response: string }) => {
    onCustomResponse(values.response);
    form.resetFields();
  };

  return (
    <Modal
      title={currentResponse ? 'Edit Response' : 'Respond'}
      open={isOpen}
      onCancel={onClose}
      footer={null}
    >
      <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
        <Text strong>Quick Responses</Text>
        <Space>
          <Button onClick={() => onQuickResponse('supplied')} disabled={responding}>
            Supplied
          </Button>
          <Button onClick={() => onQuickResponse('received')} disabled={responding}>
            Received
          </Button>
        </Space>
      </Space>

      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="response"
          label="Custom Response"
          rules={[{ required: true, message: 'Please enter a response' }]}
        >
          <Input.TextArea rows={3} placeholder="eg: Not supplied as pt currently discharged" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={responding}>
              {currentResponse ? 'Update' : 'Submit'}
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

// Announcement Card Component
function AnnouncementCard({ announcement, onResponse }: { announcement: Announcement; onResponse?: () => void }) {
  const { user, isAdmin } = useAuth();
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responding, setResponding] = useState(false);
  const [announcementData, setAnnouncementData] = useState(announcement);

  const handleQuickResponse = async (response: string) => {
    if (!user) return;
    setResponding(true);
    try {
      await announcementApi.respondToAnnouncement(announcement.id, response);
      const updated = await announcementApi.getAnnouncement(announcement.id);
      setAnnouncementData(updated);
      setShowResponseModal(false);
      if (onResponse) onResponse();
      message.success('Response submitted');
    } catch (error) {
      console.error('Failed to respond:', error);
      message.error('Failed to submit response');
    } finally {
      setResponding(false);
    }
  };

  const handleCustomResponse = async (response: string) => {
    if (!user || !response.trim()) return;
    await handleQuickResponse(response);
  };

  const handleArchive = async () => {
    try {
      await announcementApi.archiveAnnouncement(announcementData.id);
      if (onResponse) onResponse();
      message.success('Announcement archived');
    } catch (error) {
      message.error('Failed to archive');
    }
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: 'Delete Announcement',
      content: 'Are you sure you want to delete this announcement? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await announcementApi.deleteAnnouncement(announcementData.id);
          if (onResponse) onResponse();
          message.success('Announcement deleted');
        } catch (error) {
          message.error('Failed to delete');
        }
      }
    });
  };

  const userResponse = announcementData.responses?.find(r => r.userId === user?.id);

  const menuItems = [
    {
      key: 'archive',
      label: 'Archive',
      icon: <ContainerOutlined />,
      onClick: handleArchive,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete,
    },
  ];

  return (
    <Card
      hoverable
      style={{ borderColor: announcementData.isPinned ? '#f59e0b' : undefined }}
      extra={isAdmin && (
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )}
      title={
        <Space>
          {announcementData.isPinned && <PushpinFilled style={{ color: '#f59e0b' }} />}
          <Text strong>{announcementData.title}</Text>
          {announcementData.isSticky && <Tag color="blue">Sticky</Tag>}
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Space split={<Divider type="vertical" />} size="small" wrap>
          <Space><UserOutlined /> {announcementData.author?.fullName}</Space>
          <Tag color="geekblue">{announcementData.category?.name}</Tag>
          <Space><ClockCircleOutlined /> {format(new Date(announcementData.createdAt), 'MMM d, yyyy HH:mm')}</Space>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <RichTextDisplay text={announcementData.content} />
      </div>

      {/* User Response Section */}
      {user && (
        <div style={{ marginTop: 16 }}>
          {userResponse ? (
            <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text strong>{user.fullName}:</Text>
                  <Text>{userResponse.response}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({format(new Date(userResponse.createdAt), 'MMM d, HH:mm')})
                  </Text>
                </Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => setShowResponseModal(true)}>
                  Edit
                </Button>
              </Space>
            </Card>
          ) : (
            (!announcementData.responses || announcementData.responses.length === 0) && (
              <Button type="primary" icon={<MessageOutlined />} onClick={() => setShowResponseModal(true)}>
                Respond
              </Button>
            )
          )}
        </div>
      )}

      {/* Other Responses */}
      {!userResponse && announcementData.responses && announcementData.responses.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <List
            size="small"
            dataSource={announcementData.responses}
            renderItem={(response) => (
              <List.Item>
                <Space>
                  <Text strong>{response.user?.fullName}:</Text>
                  <Text>{response.response}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({format(new Date(response.createdAt), 'MMM d, HH:mm')})
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        </div>
      )}

      <ResponseModal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        onQuickResponse={handleQuickResponse}
        onCustomResponse={handleCustomResponse}
        responding={responding}
        currentResponse={userResponse?.response}
      />
    </Card>
  );
}

// Passover Card Component
function PassoverCard({ passover, onResponse }: { passover: Passover; onResponse?: () => void }) {
  const { user, isAdmin } = useAuth();
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responding, setResponding] = useState(false);
  const [passoverData, setPassoverData] = useState(passover);

  const handleQuickResponse = async (response: string) => {
    if (!user) return;
    setResponding(true);
    try {
      await passoverApi.respondToPassover(passover.id, response);
      const updated = await passoverApi.getPassover(passover.id);
      setPassoverData(updated);
      setShowResponseModal(false);
      if (onResponse) onResponse();
      message.success('Response submitted');
    } catch (error) {
      console.error('Failed to respond:', error);
      message.error('Failed to submit response');
    } finally {
      setResponding(false);
    }
  };

  const handleCustomResponse = async (response: string) => {
    if (!user || !response.trim()) return;
    await handleQuickResponse(response);
  };

  const handleArchive = async () => {
    try {
      await passoverApi.archivePassover(passoverData.id);
      if (onResponse) onResponse();
      message.success('Passover archived');
    } catch (error) {
      message.error('Failed to archive');
    }
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: 'Delete Passover',
      content: 'Are you sure you want to delete this passover?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await passoverApi.deletePassover(passoverData.id);
          if (onResponse) onResponse();
          message.success('Passover deleted');
        } catch (error) {
          message.error('Failed to delete');
        }
      }
    });
  };

  const userResponse = passoverData.responses?.find((r: any) => r.userId === user?.id);
  const contentText = typeof passoverData.content === 'string'
    ? passoverData.content
    : (passoverData.content?.text || JSON.stringify(passoverData.content, null, 2));

  const hasResponses = passoverData.responses && passoverData.responses.length > 0;

  const menuItems = [
    {
      key: 'archive',
      label: 'Archive',
      icon: <ContainerOutlined />,
      onClick: handleArchive,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete,
    },
  ];

  return (
    <Card
      hoverable
      style={{ background: !hasResponses ? '#e6f7ff' : undefined }}
      extra={isAdmin && (
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )}
      title={
        <Space direction="vertical" size={0}>
          <Text strong>Passover from {passoverData.outgoingUser?.fullName}</Text>
          <Space size="small">
            <Tag color="cyan">{passoverData.category?.name}</Tag>
            {passoverData.group && <Tag>Group: {passoverData.group.name}</Tag>}
            {passoverData.incomingUser && <Tag>To: {passoverData.incomingUser.fullName}</Tag>}
          </Space>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <RichTextDisplay text={contentText} />
      </div>

      {/* Attachments */}
      {passoverData.attachments && Array.isArray(passoverData.attachments) && passoverData.attachments.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Attachments:</Text>
          <Image.PreviewGroup>
            <Space wrap>
              {passoverData.attachments.map((attachment: any, index: number) => {
                const isImage = attachment.mimetype?.startsWith('image/');
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const imageUrl = `${baseUrl}${attachment.path}`;

                if (isImage) {
                  return (
                    <Image
                      key={index}
                      width={100}
                      height={100}
                      src={imageUrl}
                      alt={attachment.originalName}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                    />
                  );
                }
                return (
                  <Button
                    key={index}
                    icon={<PaperClipOutlined />}
                    href={imageUrl}
                    target="_blank"
                  >
                    {attachment.originalName}
                  </Button>
                );
              })}
            </Space>
          </Image.PreviewGroup>
        </div>
      )}

      {/* Response Section */}
      {user && (
        passoverData.incomingUserId === user.id ||
        (passoverData.group && passoverData.group.users &&
          (passoverData.group as any).users.some((gu: any) => gu.user?.id === user.id || gu.userId === user.id))
      ) && (
          <div style={{ marginTop: 16 }}>
            {userResponse ? (
              <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#1890ff' }} />
                    <Text strong>{user.fullName}:</Text>
                    <Text>{typeof userResponse.response === 'object' ? userResponse.response.text : userResponse.response}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ({format(new Date(userResponse.createdAt), 'MMM d, HH:mm')})
                    </Text>
                  </Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => setShowResponseModal(true)}>
                    Edit
                  </Button>
                </Space>
              </Card>
            ) : (
              (!passoverData.responses || passoverData.responses.length === 0) && (
                <Button type="primary" icon={<MessageOutlined />} onClick={() => setShowResponseModal(true)}>
                  Respond
                </Button>
              )
            )}
          </div>
        )}

      <ResponseModal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        onQuickResponse={handleQuickResponse}
        onCustomResponse={handleCustomResponse}
        responding={responding}
        currentResponse={typeof userResponse?.response === 'object' ? userResponse.response.text : userResponse?.response}
      />

      {/* Other Responses */}
      {passoverData.responses && passoverData.responses.length > 0 && (() => {
        const otherResponses = passoverData.responses.filter((response: any) => response.userId !== user?.id);
        if (otherResponses.length > 0) {
          return (
            <div style={{ marginTop: 16 }}>
              <List
                size="small"
                dataSource={otherResponses}
                renderItem={(response: any) => (
                  <List.Item>
                    <Space>
                      <Text strong>{response.user?.fullName}:</Text>
                      <Text>{typeof response.response === 'object' ? response.response.text : response.response}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({format(new Date(response.createdAt), 'MMM d, HH:mm')})
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          );
        }
        return null;
      })()}
    </Card>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
