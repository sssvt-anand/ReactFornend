import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  InputNumber, 
  message, 
  Statistic, 
  Row, 
  Col, 
  Progress,
  Modal,
  Form,
  Skeleton
} from 'antd';
import {  EditOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MemberBudgetPage = () => {
  const [memberBudgets, setMemberBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [ setEditingMember] = useState(null);
  const [form] = Form.useForm();

  const safeToFixed = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return `₹${Number(value).toFixed(2)}`;
  };

  const columns = [
    {
      title: 'Member Name',
      dataIndex: 'memberName',
      key: 'memberName',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Monthly Budget',
      dataIndex: 'monthlyBudget',
      key: 'monthlyBudget',
      render: safeToFixed
    },
    {
      title: 'Utilized Budget',
      dataIndex: 'utilizedBudget',
      key: 'utilizedBudget',
      render: safeToFixed
    },
    {
      title: 'Remaining Budget',
      dataIndex: 'remainingBudget',
      key: 'remainingBudget',
      render: (value) => (
        <span style={{ color: value < 0 ? 'red' : 'inherit' }}>
          {safeToFixed(value)}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EditOutlined />} 
          onClick={() => showEditModal(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, statusRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/budget/members`),
        axios.get(`${API_BASE_URL}/api/budget/status`)
      ]);
      
      setMemberBudgets(membersRes.data || []);
      setBudgetStatus(statusRes.data || {});
    } catch (error) {
      message.error('Failed to fetch budget data');
    } finally {
      setLoading(false);
    }
  };

  const showEditModal = (member) => {
    setEditingMember(member);
    form.setFieldsValue({
      memberId: member.memberId,
      monthlyBudget: member.monthlyBudget
    });
    setIsModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      await axios.post(`${API_BASE_URL}/api/budget/members/${values.memberId}`, {
        monthlyBudget: values.monthlyBudget
      });
      message.success('Budget updated successfully');
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update budget');
    }
  };

  const handleInitializeBudget = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/budget/initialize`);
      message.success('New month budget initialized successfully');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to initialize budget');
    }
  };

  const handleRecalculateBudget = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/budget/recalculate`);
      message.success('Budget recalculated successfully');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to recalculate budget');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !memberBudgets.length) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  return (
    <div className="member-budget-page">
      <h1 style={{ marginBottom: 24 }}>Member Budget Management</h1>
      
      {budgetStatus ? (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Total Budget"
                  value={budgetStatus.totalBudget || 0}
                  precision={2}
                  prefix="₹"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Utilized Budget"
                  value={budgetStatus.utilizedBudget || 0}
                  precision={2}
                  prefix="₹"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Remaining Budget"
                  value={budgetStatus.remainingBudget || 0}
                  precision={2}
                  prefix="₹"
                />
              </Card>
            </Col>
          </Row>

          <Card style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <strong>Budget Utilization:</strong> {budgetStatus.monthYear || 'Current Month'}
            </div>
            <Progress
              percent={Math.min(
                ((budgetStatus.utilizedBudget || 0) / (budgetStatus.totalBudget || 1)) * 100,
                100
              )}
              status={
                ((budgetStatus.utilizedBudget || 0) / (budgetStatus.totalBudget || 1)) > 0.9 
                  ? 'exception' 
                  : 'normal'
              }
            />
          </Card>
        </>
      ) : (
        <Skeleton active paragraph={{ rows: 4 }} />
      )}

      <Card
        title="Member Budgets"
        extra={
          <div>
            <Button 
              type="primary" 
              onClick={handleInitializeBudget}
              style={{ marginRight: 8 }}
              loading={loading}
            >
              Initialize New Month
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRecalculateBudget}
              loading={loading}
            >
              Recalculate
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={memberBudgets}
          rowKey="memberId"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: 'No budget data available'
          }}
        />
      </Card>

      <Modal
        title="Edit Member Budget"
        visible={isModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="memberId" label="Member ID" hidden>
            <InputNumber disabled />
          </Form.Item>
          <Form.Item
            name="monthlyBudget"
            label="Monthly Budget"
            rules={[{ 
              required: true, 
              message: 'Please input the monthly budget' 
            }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              prefix="₹"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MemberBudgetPage;