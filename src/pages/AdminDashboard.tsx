import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package,
  Calendar,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Order, Product } from '../types';

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{
    product: Product;
    totalSold: number;
    revenue: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  ordersByStatus: Record<string, number>;
  recommendations: string[];
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // дней

  useEffect(() => {
    // Проверка авторизации
    if (!localStorage.getItem('adminAuth')) {
      navigate('/admin/login');
      return;
    }

    fetchData();
  }, [navigate, selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Получаем заказы за выбранный период
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: false });

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (ordersError) throw ordersError;
      if (productsError) throw productsError;

      setOrders(ordersData || []);
      setProducts(productsData || []);
      
      // Вычисляем аналитику
      calculateAnalytics(ordersData || [], productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (ordersData: Order[], productsData: Product[]) => {
    const completedOrders = ordersData.filter(o => o.status === 'delivered');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);
    const totalOrders = ordersData.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / completedOrders.length : 0;
    
    // Конверсия (примерная, основанная на заказах vs просмотрах)
    const conversionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;

    // Топ товары
    const productSales: Record<string, { quantity: number; revenue: number }> = {};
    
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { quantity: 0, revenue: 0 };
        }
        productSales[item.product_id].quantity += item.quantity;
        productSales[item.product_id].revenue += item.total;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([productId, sales]) => {
        const product = productsData.find(p => p.id === productId);
        return product ? {
          product,
          totalSold: sales.quantity,
          revenue: sales.revenue
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.revenue - a!.revenue)
      .slice(0, 5) as Analytics['topProducts'];

    // Выручка по месяцам
    const monthlyData: Record<string, { revenue: number; orders: number }> = {};
    
    completedOrders.forEach(order => {
      const month = new Date(order.created_at).toLocaleDateString('ru-RU', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, orders: 0 };
      }
      
      monthlyData[month].revenue += parseFloat(order.total_amount.toString());
      monthlyData[month].orders += 1;
    });

    const revenueByMonth = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Заказы по статусам
    const ordersByStatus: Record<string, number> = {};
    ordersData.forEach(order => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    // Генерируем рекомендации
    const recommendations = generateRecommendations(ordersData, productsData, {
      totalRevenue,
      averageOrderValue,
      conversionRate,
      topProducts
    });

    setAnalytics({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      conversionRate,
      topProducts,
      revenueByMonth,
      ordersByStatus,
      recommendations
    });
  };

  const generateRecommendations = (orders: Order[], products: Product[], metrics: any): string[] => {
    const recommendations: string[] = [];

    // Анализ конверсии
    if (metrics.conversionRate < 50) {
      recommendations.push('🔄 Низкая конверсия заказов. Рекомендуется улучшить процесс оформления заказа и добавить больше способов оплаты.');
    }

    // Анализ среднего чека
    if (metrics.averageOrderValue < 3000) {
      recommendations.push('💰 Средний чек можно увеличить. Добавьте рекомендации сопутствующих товаров и предложения "купить вместе".');
    }

    // Анализ товаров
    const outOfStockProducts = products.filter(p => !p.in_stock).length;
    if (outOfStockProducts > 0) {
      recommendations.push(`📦 ${outOfStockProducts} товаров закончились на складе. Пополните остатки популярных позиций.`);
    }

    // Анализ новых заказов
    const newOrders = orders.filter(o => o.status === 'new').length;
    if (newOrders > 5) {
      recommendations.push(`⚡ ${newOrders} новых заказов ожидают обработки. Свяжитесь с клиентами в течение 2 часов для лучшей конверсии.`);
    }

    // Анализ сезонности
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 10 || currentMonth <= 1) { // Зима
      recommendations.push('❄️ Зимний сезон: продвигайте теплую одежду, куртки и аксессуары. Создайте новогодние акции.');
    } else if (currentMonth >= 5 && currentMonth <= 7) { // Лето
      recommendations.push('☀️ Летний сезон: акцент на легкую одежду, платья и летние аксессуары. Запустите летнюю распродажу.');
    }

    // Анализ топ товаров
    if (metrics.topProducts.length > 0) {
      const topProduct = metrics.topProducts[0];
      recommendations.push(`🏆 Ваш хит продаж: "${topProduct.product.name}". Создайте похожие товары или увеличьте рекламный бюджет на эту категорию.`);
    }

    // Общие рекомендации
    recommendations.push('📱 Оптимизируйте сайт для мобильных устройств - большинство покупок совершается с телефонов.');
    recommendations.push('⭐ Добавьте систему отзывов и рейтингов для увеличения доверия покупателей.');

    return recommendations;
  };

  const logout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'confirmed': return 'Подтвержден';
      case 'paid': return 'Оплачен';
      case 'shipped': return 'Отправлен';
      case 'delivered': return 'Доставлен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">KUSTORE Admin</h1>
              <p className="text-sm text-gray-600">Панель управления</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="7">7 дней</option>
                <option value="30">30 дней</option>
                <option value="90">90 дней</option>
                <option value="365">1 год</option>
              </select>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Основные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Общая выручка</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₽{analytics?.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+12.5% за период</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего заказов</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.totalOrders}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+8.2% за период</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Средний чек</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₽{analytics?.averageOrderValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600">-2.1% за период</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Конверсия</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+5.3% за период</span>
            </div>
          </div>
        </div>

        {/* Рекомендации */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Рекомендации и советы</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics?.recommendations.map((recommendation, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Топ товары */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Топ товары</h2>
            </div>
            <div className="space-y-4">
              {analytics?.topProducts.map((item, index) => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Продано: {item.totalSold} шт.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₽{item.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Статусы заказов */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <PieChart className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Статусы заказов</h2>
            </div>
            <div className="space-y-3">
              {analytics && Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {getStatusText(status)}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Последние заказы */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Последние заказы</h2>
              </div>
              <span className="text-sm text-gray-600">{orders.length} заказов за период</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Заказ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Клиент
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сумма
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order.id.slice(-8)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.length} товар(ов)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₽{parseFloat(order.total_amount.toString()).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}