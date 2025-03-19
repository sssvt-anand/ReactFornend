import React, { useEffect, useState } from 'react';
import { Layout, Card, Table, Statistic, Row, Col, Typography, Spin, Alert } from 'antd';
import { DollarOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../utils/api';
import moment from 'moment';

const { Content } = Layout;
const { Title } = Typography;

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ 
    total: 0, 
    totalCleared: 0,
    totalRemaining: 0,
    count: 0 
  });
  const [memberBalances, setMemberBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const expensesRes = await api.get("/api/expenses");
      const allExpenses = expensesRes.data;

      // Calculate totals
      const totalAmount = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalCleared = allExpenses.reduce((sum, expense) => sum + (expense.clearedAmount || 0), 0);
      const totalRemaining = totalAmount - totalCleared;

      setSummary({
        total: totalAmount,
        totalCleared: totalCleared,
        totalRemaining: totalRemaining,
        count: allExpenses.length
      });

      // Recent expenses (last 5)
      setExpenses(allExpenses.slice(-5).reverse());

      // Fetch and format member balances
      const balancesRes = await api.get("/api/expenses/summary");
      const formattedBalances = Object.entries(balancesRes.data).map(([name, balances]) => ({
        key: name,
        name,
        total: balances.total,
        cleared: balances.cleared,
        remaining: balances.remaining
      }));
      setMemberBalances(formattedBalances);
    } catch (error) {
      setError('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const expenseColumns = [
    {
      title: 'Member',
      dataIndex: ['member', 'name'],
      key: 'member',
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
      render: value => `₹${value.toFixed(2)}`
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: date => moment(date).format('YYYY-MM-DD')
    }
  ];

  const balanceColumns = [
    {
      title: 'Member',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: value => `₹${value.toFixed(2)}`
    },
    {
      title: 'Cleared',
      dataIndex: 'cleared',
      key: 'cleared',
      render: value => `₹${value.toFixed(2)}`
    },
    {
      title: 'Remaining',
      dataIndex: 'remaining',
      key: 'remaining',
      render: value => `₹${value.toFixed(2)}`
    },
  ];

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', padding: '24px' }}>
        <Content style={{ textAlign: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh', padding: '24px' }}>
        <Content style={{ textAlign: 'center' }}>
          <Alert message={error} type="error" showIcon />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', padding: '24px' }}>
      <Content>
        <Title level={2}>Dashboard Overview</Title>
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Expenses"
                value={summary.total}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Cleared"
                value={summary.totalCleared}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Remaining"
                value={summary.totalRemaining}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Transactions"
                value={summary.count}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <Card title="Recent Expenses">
              <Table
                dataSource={expenses}
                columns={expenseColumns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Member Balances">
              <Table
                dataSource={memberBalances}
                columns={balanceColumns}
                rowKey="key"
                pagination={false}
                bordered
                size="small"
                locale={{
                  emptyText: 'No member balances found'
                }}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default Dashboard;
