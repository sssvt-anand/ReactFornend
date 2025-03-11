import React, { useEffect, useState, useCallback } from 'react';
import { 
  Layout, Table, Button, Modal, Form, Input, Select, message, Card, DatePicker, Space, Typography 
} from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Option } = Select;
const { Text } = Typography;

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

// Axios request interceptor
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ExpenseDashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberExpenses, setMemberExpenses] = useState([]);
  const [isExpenseModalVisible, setExpenseModalVisible] = useState(false);
  const [isMemberModalVisible, setMemberModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [currentExpenseId, setCurrentExpenseId] = useState(null);
  const [userRole, setUserRole] = useState('USER');

  // Response interceptor for handling 401 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate]);

  // Enhanced role extraction from JWT
  const getRoleFromToken = (decoded) => {
  try {
    // Handle both singular 'role' and plural 'roles' claims
    const roles = decoded.roles || decoded.role || [];
    const roleValue = Array.isArray(roles) ? roles[0] : roles;
    
    // Handle Spring Security's GrantedAuthority object format
    const roleString = typeof roleValue === 'object' 
      ? roleValue.authority 
      : roleValue;

    return roleString?.replace(/^ROLE_/i, '')?.toUpperCase() || 'USER';
  } catch (error) {
    console.error('Role extraction error:', error);
    return 'USER';
  }
};

  // Authentication and data initialization
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log('[DEBUG] Decoded Token:', decoded);

      // Check token expiration
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }

      // Extract and set role
      const role = getRoleFromToken(decoded);
      console.log('[DEBUG] User Role:', role);
      setUserRole(role || 'USER'); // Ensure fallback to USER

      // Fetch initial data
      const fetchData = async () => {
        try {
          await Promise.all([
            fetchExpenses(),
            fetchMembers(),
            fetchMemberExpenses()
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
  }, [navigate]);

  // Data fetching functions
  const fetchExpenses = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/expenses`);
      setExpenses(response.data);
    } catch (error) {
      handleApiError(error, 'Failed to fetch expenses');
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/members`);
      setMembers(response.data);
    } catch (error) {
      handleApiError(error, 'Failed to fetch members');
    }
  }, []);

  const fetchMemberExpenses = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/expenses/summary`);
      const formattedData = Object.entries(response.data).map(([name, amounts]) => ({
        name,
        total: amounts.total,
        cleared: amounts.cleared,
        remaining: amounts.remaining
      }));
      setMemberExpenses(formattedData);
    } catch (error) {
      handleApiError(error, 'Failed to fetch member expenses');
    }
  }, []);

  // Centralized error handler
  const handleApiError = (error, defaultMessage) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 403) {
        message.error(data.message || 'Permission denied');
      } else {
        message.error(data?.message || defaultMessage);
      }
    } else {
      message.error(defaultMessage);
    }
  };

  // Expense operations
  const handleAddExpense = async (values) => {
    try {
      await axios.post(`${apiBaseUrl}/api/expenses`, values);
      message.success('Expense added successfully!');
      setExpenseModalVisible(false);
      form.resetFields();
      await Promise.all([fetchExpenses(), fetchMemberExpenses()]);
    } catch (error) {
      handleApiError(error, 'Failed to add expense');
    }
  };

  const handleUpdateExpense = async (values) => {
    try {
      await axios.put(`${apiBaseUrl}/api/expenses/${currentExpenseId}`, values);
      message.success('Expense updated successfully!');
      setExpenseModalVisible(false);
      setIsEditing(false);
      setCurrentExpenseId(null);
      form.resetFields();
      await Promise.all([fetchExpenses(), fetchMemberExpenses()]);
    } catch (error) {
      handleApiError(error, 'Failed to update expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`${apiBaseUrl}/api/expenses/${id}`);
      message.success('Expense deleted successfully!');
      await Promise.all([fetchExpenses(), fetchMemberExpenses()]);
    } catch (error) {
      handleApiError(error, 'Failed to delete expense');
    }
  };

  // Member operations
  const handleAddMember = async (values) => {
    try {
      await axios.post(`${apiBaseUrl}/api/members`, values);
      message.success('Member added successfully!');
      setMemberModalVisible(false);
      memberForm.resetFields();
      await fetchMembers();
    } catch (error) {
      handleApiError(error, 'Failed to add member');
    }
  };

  // Table columns configuration
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => userRole === 'ADMIN' && (
        <Space>
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
          <Button danger onClick={() => handleDeleteExpense(record.id)}>
            Delete
          </Button>
        </Space>
      ),
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
        <Card title="Member Balances" style={{ marginBottom: 24 }}>
          {memberExpenses.map(member => (
            <div key={member.name} style={{ 
              padding: 12,
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <Text strong>{member.name}</Text>
              <Space size="large">
                <Text>Total: ₹{member.total.toFixed(2)}</Text>
                <Text type="success">Cleared: ₹{member.cleared.toFixed(2)}</Text>
                <Text type="danger">Remaining: ₹{member.remaining.toFixed(2)}</Text>
              </Space>
            </div>
          ))}
        </Card>

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
          
          {userRole === 'ADMIN' && (
            <Button 
              type="dashed" 
              icon={<UserOutlined />}
              onClick={() => setMemberModalVisible(true)}
            >
              Add Member
            </Button>
          )}
        </Space>

        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          bordered
          pagination={{ pageSize: 8 }}
        />

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
                  <Option key={member.id} value={member.id}>
                    {member.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true }]}>
              <Input placeholder="Enter expense description" />
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
          title="Add New Member"
          open={isMemberModalVisible}
          onCancel={() => setMemberModalVisible(false)}
          footer={null}
        >
          <Form form={memberForm} onFinish={handleAddMember} layout="vertical">
            <Form.Item 
              name="name" 
              label="Member Name"
              rules={[{ 
                required: true, 
                message: 'Please enter member name' 
              }]}
            >
              <Input 
                placeholder="Enter member's full name" 
                prefix={<UserOutlined />} 
              />
            </Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block
              icon={<PlusOutlined />}
            >
              Create Member
            </Button>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ExpenseDashboard;