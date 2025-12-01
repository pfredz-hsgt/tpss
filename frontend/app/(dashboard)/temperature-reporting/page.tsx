'use client';

import { useState, useEffect } from 'react';
import {
  Typography, Form, DatePicker, Select, Input, Button,
  Card, Checkbox, Alert, Spin, message, Row, Col, Space, Divider
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { temperatureApi, FridgeSection } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function TemperatureReportingPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [sections, setSections] = useState<FridgeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const data = await temperatureApi.getFridgeSections();
      setSections(data);

      // Initialize all fridges as checked (In Range)
      const initialChecked: Record<string, boolean> = {};
      data.forEach((section) => {
        section.fridges?.forEach((fridge) => {
          initialChecked[fridge.id] = true;
        });
      });

      form.setFieldsValue({
        date: dayjs(),
        fridges: initialChecked
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load fridge sections');
      message.error('Failed to load fridge sections');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Build entries array
      const entries = Object.entries(values.fridges || {}).map(([fridgeId, temperatureInRange]) => ({
        fridgeId,
        temperatureInRange: temperatureInRange as boolean,
      }));

      await temperatureApi.createTemperatureReport({
        date: values.date.format('YYYY-MM-DD'),
        time: values.time,
        remarks: values.remarks,
        entries,
      });

      setSuccess('Temperature report submitted successfully!');
      message.success('Temperature report submitted successfully!');

      // Reset form but keep date as today and reset fridges to all checked
      const resetChecked: Record<string, boolean> = {};
      sections.forEach((section) => {
        section.fridges?.forEach((fridge) => {
          resetChecked[fridge.id] = true;
        });
      });

      form.resetFields();
      form.setFieldsValue({
        date: dayjs(),
        fridges: resetChecked
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to submit temperature report';
      setError(errorMsg);
      message.error(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Temperature Reporting</Title>
        <Text type="secondary">Submit daily temperature logs for all fridges</Text>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
          style={{ marginBottom: 24 }}
        />
      )}

      {success && (
        <Alert
          message="Success"
          description={success}
          type="success"
          showIcon
          closable
          onClose={() => setSuccess('')}
          style={{ marginBottom: 24 }}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Card bordered={false} shadow="sm">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              time: '',
            }}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="date"
                  label="Date"
                  rules={[{ required: true, message: 'Please select a date' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="time"
                  label="Time"
                  rules={[{ required: true, message: 'Please select a time slot' }]}
                >
                  <Select placeholder="Select time slot">
                    <Select.Option value="12am">12:00 AM</Select.Option>
                    <Select.Option value="2am">02:00 AM</Select.Option>
                    <Select.Option value="4am">04:00 AM</Select.Option>
                    <Select.Option value="6am">06:00 AM</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Fridge Temperature Status</Divider>

            {sections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                No fridge sections configured. Please go to "Manage Fridge" to add sections and fridges.
              </div>
            ) : (
              <div style={{ marginBottom: 24 }}>
                {sections.map((section) => (
                  <Card
                    key={section.id}
                    type="inner"
                    title={section.name}
                    size="small"
                    style={{ marginBottom: 16, background: '#fafafa' }}
                  >
                    {section.fridges && section.fridges.length > 0 ? (
                      <Row gutter={[16, 16]}>
                        {section.fridges.map((fridge) => (
                          <Col xs={24} sm={12} md={8} lg={6} key={fridge.id}>
                            <Form.Item
                              name={['fridges', fridge.id]}
                              valuePropName="checked"
                              style={{ marginBottom: 0 }}
                            >
                              <Checkbox>
                                <Text strong>{fridge.name}</Text>
                              </Checkbox>
                            </Form.Item>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Text type="secondary" italic>No fridges in this section</Text>
                    )}
                  </Card>
                ))}
              </div>
            )}

            <Form.Item
              name="remarks"
              label="Remarks (Optional)"
            >
              <TextArea
                rows={4}
                placeholder="Enter any additional findings or issues..."
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                disabled={sections.length === 0}
                block
                size="large"
              >
                Submit Report
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
}
