import React, { useEffect, useState, useCallback } from 'react';
import { 
  Layout, Table, Button, Modal, Form, Input, Select, message, Space, Typography 
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Option } = Select;
const { Text } = Typography;

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [isExpenseModalVisible, setExpenseModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [currentExpenseId, setCurrentExpenseId] = useState(null);
  const [userRole, setUserRole] = useState('USER');
  const [selectedClearMemberId, setSelectedClearMemberId] = useState(null);
  const [isClearModalVisible, setClearModalVisible] = useState(false);
  const [currentClearExpenseId, setCurrentClearExpenseId] = useState(null);
  const [clearAmount, setClearAmount] = useState('');

  const getRoleFromToken = useCallback((decoded) => {
    try {
      const roles = decoded.roles || decoded.role || [];
      const rolesArray = Array.isArray(roles) ? roles : [roles];
      const role = rolesArray
        .find(r => r)
        ?.replace(/^ROLE_/ig, '')
        ?.toUpperCase() || 'USER';
      return role === 'ROLE_ADMIN' ? 'ADMIN' : role;
    } catch (error) {
      console.error('Error decoding role:', error);
      return 'USER';
    }
  }, []);

  const handleApiError = useCallback((error, defaultMessage) => {
    message.error(error.response?.data?.message || defaultMessage);
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/expenses`);
      setExpenses(response.data);
    } catch (error) {
      handleApiError(error, 'Failed to fetch expenses');
    }
  }, [handleApiError]);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/members`);
      setMembers(response.data);
    } catch (error) {
      handleApiError(error, 'Failed to fetch members');
    }
  }, [handleApiError]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  
    try {
      const decoded = jwtDecode(token);
      const role = getRoleFromToken(decoded);
      setUserRole(role || 'USER');

      const fetchData = async () => {
        try {
          await Promise.all([
            fetchExpenses(),
            fetchMembers(),
          ]);
        } catch (error) {
          message.error('Failed to initialize data');
        }
      };
      fetchData();
    } catch (error) {
      console.error('Authentication error:', error);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate, getRoleFromToken, fetchExpenses, fetchMembers, setUserRole]);

  const handleAddExpense = async (values) => {
    try {
      await axios.post(`${apiBaseUrl}/api/expenses`, {
        ...values,
        date: values.date.format('YYYY-MM-DD')
      });
      message.success('Expense added successfully!');
      setExpenseModalVisible(false);
      form.resetFields();
      await fetchExpenses();
    } catch (error) {
      handleApiError(error, 'Failed to add expense');
    }
  };

  const handleUpdateExpense = async (values) => {
    try {
      await axios.put(`${apiBaseUrl}/api/expenses/${currentExpenseId}`, {
        ...values,
        date: values.date.format('YYYY-MM-DD')
      });
      message.success('Expense updated successfully!');
      setExpenseModalVisible(false);
      setIsEditing(false);
      await fetchExpenses();
    } catch (error) {
      handleApiError(error, 'Failed to update expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`${apiBaseUrl}/api/expenses/${id}`);
      message.success('Expense deleted successfully!');
      await fetchExpenses();
    } catch (error) {
      handleApiError(error, 'Failed to delete expense');
    }
  };

  const handleClearExpense = async () => {
    try {
      if (!selectedClearMemberId || !clearAmount) {
        message.error('Please fill all fields');
        return;
      }
      
      await axios.put(
        `${apiBaseUrl}/api/expenses/clear/${currentClearExpenseId}`,
        null,
        { params: { memberId: selectedClearMemberId, amount: clearAmount } }
      );
      
      message.success('Payment recorded successfully!');
      setClearModalVisible(false);
      setSelectedClearMemberId(null);
      setClearAmount('');
      await fetchExpenses();
    } catch (error) {
      handleApiError(error, 'Failed to clear expense');
    }
  }; 

  const columns = [
    {
      title: 'Member',
      dataIndex: ['member', 'name'],
      key: 'member',
      sorter: (a, b) => a.member.name.localeCompare(b.member.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: value => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: date => moment(date).format('YYYY-MM-DD'),
    },
    {
        title: 'Status',
        key: 'status',
        render: (_, record) => {
          // Safely handle undefined values
          const total = record.amount || 0;
          const cleared = record.clearedAmount || 0;
          const lastCleared = record.lastClearedAmount || 0;
          const remaining = total - cleared;
      
          return (
            <Space direction="vertical">
              {record.cleared ? (
                <Text type="success">
                  Fully Cleared: ₹{cleared.toFixed(2)}
                  <br/>
                  By {record.clearedBy?.name || 'unknown'} 
                  ({record.clearedAt ? moment(record.clearedAt).format('MMM Do') : 'N/A'})
                </Text>
              ) : cleared > 0 ? (
                <>
                  <Text type="warning">
                    Partially Cleared: ₹{cleared.toFixed(2)}/₹{total.toFixed(2)}
                  </Text>
                  <Text>
                    Last Payment: ₹{lastCleared.toFixed(2)} 
                    by {record.lastClearedBy?.name || 'unknown'} 
                    ({record.lastClearedAt ? moment(record.lastClearedAt).format('MMM Do') : 'N/A'})
                  </Text>
                  <Text type="danger">
                    Remaining: ₹{remaining.toFixed(2)}
                  </Text>
                </>
              ) : (
                <Text type="secondary">Pending Clearance</Text>
              )}
            </Space>
          );
        }
      },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const remaining = record.amount - (record.clearedAmount || 0);
        const isFullyCleared = remaining <= 0;
        
        return (
          <Space>
            {userRole === 'ADMIN' && (
              <>
                {!isFullyCleared && (
                  <Button onClick={() => {
                    setExpenseModalVisible(true);
                    setIsEditing(true);
                    setCurrentExpenseId(record.id);
                    form.setFieldsValue({
                      memberId: record.member.id,
                      description: record.description,
                      amount: record.amount,
                      date: moment(record.date)
                    });
                  }}>
                    Edit
                  </Button>
                )}
                <Button danger onClick={() => handleDeleteExpense(record.id)}>
                  Delete
                </Button>
              </>
            )}
            {!isFullyCleared && (
              <Button 
                type="primary" 
                ghost 
                onClick={() => {
                  setCurrentClearExpenseId(record.id);
                  setClearModalVisible(true);
                }}
              >
                {record.clearedAmount > 0 ? 'Add Payment' : 'Clear'}
              </Button>
            )}
          </Space>
        );
      }
    },
  ];

  return (
    <Layout style={{ padding: 24, minHeight: '100vh' }}>
      <div style={{ 
        position: 'absolute', 
        top: 16, 
        right: 24, 
        color: userRole === 'ADMIN' ? '#52c41a' : '#1890ff',
        fontWeight: 'bold'
      }}>
        {userRole === 'ADMIN' ? '⚡ Admin User' : '👤 Regular User'}
      </div>
      
      <Content>
         <Space style={{ marginBottom: 24 }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => {
              setExpenseModalVisible(true);
              form.resetFields();
            }}
          >
            Add Expense
          </Button>
          
          
        </Space>

        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          bordered
          pagination={{ pageSize: 8 }}
        />

        {/* Modals */}
        <Modal
          title={isEditing ? "Edit Expense" : "Add Expense"}
          open={isExpenseModalVisible}
          onCancel={() => setExpenseModalVisible(false)}
          footer={null}
        >
          <Form form={form} onFinish={isEditing ? handleUpdateExpense : handleAddExpense} layout="vertical">
            <Form.Item name="memberId" label="Member" rules={[{ required: true }]}>
              <Select placeholder="Select member">
                {members.map(member => (
                  <Option key={member.id} value={member.id}>{member.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true }]}>
              <Input placeholder="Enter description" />
            </Form.Item>
            <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
              <Input type="number" placeholder="Enter amount" />
            </Form.Item>
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
              {isEditing ? "Update Expense" : "Add Expense"}
            </Button>
          </Form>
        </Modal>

        

        <Modal
          title="Record Payment"
          open={isClearModalVisible}
          onCancel={() => {
            setClearModalVisible(false);
            setSelectedClearMemberId(null);
            setClearAmount('');
          }}
          onOk={handleClearExpense}
          okText="Record Payment"
        >
          <Form layout="vertical">
            <Form.Item label="Select Member" required>
              <Select
                placeholder="Select member"
                onChange={value => setSelectedClearMemberId(value)}
              >
                {members.map(member => (
                  <Option key={member.id} value={member.id}>{member.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Payment Amount" required>
              <Input
                type="number"
                placeholder="Enter amount"
                value={clearAmount}
                onChange={e => setClearAmount(e.target.value)}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default AdminDashboard;