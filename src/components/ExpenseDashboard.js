import React, { useEffect, useState, useCallback } from 'react';
import { 
  Layout, Table, Typography, Space, message,
  Button, Form, Input, Select, DatePicker, Modal,
  Descriptions, Divider, Tag, Statistic, Row, Col, Spin, Card
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Text } = Typography;
const { Option } = Select;

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
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [form] = Form.useForm();
  const [userRole, setUserRole] = useState('USER');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isPaymentHistoryLoading, setIsPaymentHistoryLoading] = useState(false);

  // Memoized functions
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
    if (error.response) {
      const { data } = error.response;
      message.error(data?.message || defaultMessage);
    } else {
      message.error(defaultMessage);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/expenses`);
      setExpenses(response.data);
    } catch (error) {
      handleApiError(error, 'Failed to fetch expenses');
    }
  }, [handleApiError]); // Removed apiBaseUrl from dependencies

  const fetchMembers = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/members`);
      setMembers(response.data);
    } catch (error) {
      handleApiError(error, 'Failed to fetch members');
    }
  }, [handleApiError]); // Removed apiBaseUrl from dependencies

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
  }, [handleApiError]); // Removed apiBaseUrl from dependencies

  // Initialization effect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }

      const role = getRoleFromToken(decoded);
      setUserRole(role || 'USER');

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
  }, [navigate, getRoleFromToken, fetchExpenses, fetchMembers, fetchMemberExpenses, setUserRole]);

  // Expense handlers
  const handleAddExpense = async (values) => {
    try {
      await axios.post(`${apiBaseUrl}/api/expenses`, {
        ...values,
        date: values.date.format('YYYY-MM-DD')
      });
      message.success('Expense added successfully!');
      setExpenseModalVisible(false);
      form.resetFields();
      await Promise.all([fetchExpenses(), fetchMemberExpenses()]);
    } catch (error) {
      handleApiError(error, 'Failed to add expense');
    }
  };

  const showExpenseDetails = async (expense) => {
    try {
      setIsPaymentHistoryLoading(true);
      setSelectedExpense(expense);
      
      const response = await axios.get(`${apiBaseUrl}/api/expenses/${expense.id}/payments`);
      setPaymentHistory(response.data);
      
      setDetailModalVisible(true);
    } catch (error) {
      handleApiError(error, 'Failed to fetch payment history');
    } finally {
      setIsPaymentHistoryLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Member',
      dataIndex: ['memberName'],
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
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: date => moment(date).format('YYYY-MM-DD'),
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
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
      render: (_, record) => (
        <Button type="link" onClick={() => showExpenseDetails(record)}>
          View Details
        </Button>
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

        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            setExpenseModalVisible(true);
            form.resetFields();
          }}
          style={{ marginBottom: 16 }}
        >
          Add Expense
        </Button>

        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          bordered
          pagination={{ pageSize: 8 }}
          onRow={(record) => {
            return {
              onClick: () => showExpenseDetails(record),
            };
          }}
        />

        {/* Add Expense Modal */}
        <Modal
          title="Add Expense"
          open={isExpenseModalVisible}
          onCancel={() => setExpenseModalVisible(false)}
          footer={null}
        >
          <Form form={form} onFinish={handleAddExpense} layout="vertical">
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
              Add Expense
            </Button>
          </Form>
        </Modal>

        {/* Expense Detail Modal */}
        <Modal
          title="Expense Details"
          open={isDetailModalVisible}
          onCancel={() => {
            setDetailModalVisible(false);
            setPaymentHistory([]);
          }}
          footer={null}
          width={800}
        >
          {selectedExpense && (
            <>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Member" span={2}>
                  <Tag color="blue">{selectedExpense.memberName|| 'Unknown'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {selectedExpense.description}
                </Descriptions.Item>
                <Descriptions.Item label="Date">
                  {moment(selectedExpense.date).format('MMMM Do, YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {moment(selectedExpense.createdAt).format('MMMM Do, YYYY h:mm a')}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Amount Details</Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Total Amount"
                    value={selectedExpense.amount}
                    precision={2}
                    prefix="₹"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Cleared Amount"
                    value={selectedExpense.clearedAmount || 0}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Remaining Amount"
                    value={(selectedExpense.amount - (selectedExpense.clearedAmount || 0))}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ 
                      color: (selectedExpense.amount - (selectedExpense.clearedAmount || 0)) > 0 
                        ? '#cf1322' 
                        : '#3f8600'
                    }}
                  />
                </Col>
              </Row>

              <Divider orientation="left">Payment History</Divider>
              {isPaymentHistoryLoading ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <Spin size="large" />
                </div>
              ) : paymentHistory.length > 0 ? (
                <Table
  columns={[
    { 
      title: 'Amount', 
      dataIndex: 'amount', 
      render: val => `₹${val?.toFixed(2) || '0.00'}`,
      align: 'right',
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0)
    },
    
    { 
      title: 'Paid By', 
      dataIndex: ['clearedBy', 'name'],
      render: (name, record) => (
        <Text strong>{name || record.clearedBy?.name || 'Unknown'}</Text>
      )
    },
    { 
      title: 'Date', 
      dataIndex: 'timestamp',
      render: date => date ? moment(date).format('DD MMM YYYY hh:mm A') : 'N/A',
      sorter: (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0),
      defaultSortOrder: 'descend'
    },
    
  ]}
  dataSource={paymentHistory}
  rowKey="id"
  pagination={false}
  size="small"
  bordered
  summary={() => (
    <Table.Summary fixed>
      <Table.Summary.Row>
        <Table.Summary.Cell index={0} colSpan={2}>
          <Text strong>Total Cleared:</Text>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={1} align="right">
          <Text strong type="success">
            ₹{paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}
          </Text>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={2} colSpan={2} />
      </Table.Summary.Row>
    </Table.Summary>
  )}
/>
              ) : (
                <Card size="small">
                  <Text type="secondary">No payment history recorded</Text>
                </Card>
              )}
            </>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default ExpenseDashboard;