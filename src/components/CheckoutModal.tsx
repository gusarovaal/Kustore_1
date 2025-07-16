import React, { useState } from 'react';
import { X, Package, CreditCard, MapPin, Phone, Mail, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { OrderItem } from '../types';
import { supabase } from '../lib/supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { state, dispatch } = useCart();
  const { state: authState } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: authState.user?.first_name || '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    delivery_method: 'boxberry' as 'boxberry' | 'russian_post' | 'cdek',
    payment_method: 'bank_transfer' as 'bank_transfer'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Имя обязательно для заполнения';
    }
    
    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = 'Телефон обязателен для заполнения';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.customer_phone)) {
      newErrors.customer_phone = 'Введите корректный номер телефона';
    }
    
    if (!formData.delivery_address.trim()) {
      newErrors.delivery_address = 'Адрес доставки обязателен для заполнения';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!authState.user) return;
    
    setIsSubmitting(true);
    
    try {
      // Подготавливаем данные заказа
      const orderItems: OrderItem[] = state.items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image_url,
        size: item.size,
        quantity: item.quantity,
        price: item.product.is_on_sale && item.product.sale_price ? item.product.sale_price : item.product.price,
        total: (item.product.is_on_sale && item.product.sale_price ? item.product.sale_price : item.product.price) * item.quantity
      }));

      // Создаем заказ в базе данных
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: authState.user.id,
          items: orderItems,
          total_amount: state.total,
          ...formData
        })
        .select()
        .single();

      if (error) throw error;

      // Отправляем уведомление в Telegram
      await sendTelegramNotification(order.id, orderItems, formData, state.total);

      // Очищаем корзину
      dispatch({ type: 'CLEAR_CART' });
      
      setIsSuccess(true);
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
      alert('Произошла ошибка при оформлении заказа. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendTelegramNotification = async (orderId: string, items: OrderItem[], customerData: typeof formData, total: number) => {
    try {
      // Формируем сообщение для Telegram
      const message = `
🛍️ *НОВЫЙ ЗАКАЗ #${orderId.slice(-8)}*

👤 *Клиент:*
• Имя: ${customerData.customer_name}
• Телефон: ${customerData.customer_phone}
${customerData.customer_email ? `• Email: ${customerData.customer_email}` : ''}

📦 *Товары:*
${items.map(item => `• ${item.product_name} (${item.size}) x${item.quantity} = ${item.total} руб.`).join('\n')}

💰 *Итого: ${total} руб.*

🚚 *Доставка:*
• Способ: ${getDeliveryMethodName(customerData.delivery_method)}
• Адрес: ${customerData.delivery_address}

💳 *Оплата:* Банковский перевод

⏰ ${new Date().toLocaleString('ru-RU')}
      `;

      // Отправляем через edge function (если настроена) или webhook
      const response = await fetch('/api/send-telegram-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          orderId
        })
      });

      if (!response.ok) {
        console.warn('Не удалось отправить уведомление в Telegram');
      }
    } catch (error) {
      console.error('Ошибка отправки уведомления:', error);
    }
  };

  const getDeliveryMethodName = (method: string) => {
    switch (method) {
      case 'boxberry': return 'Boxberry';
      case 'russian_post': return 'Почта России';
      case 'cdek': return 'СДЭК';
      default: return method;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Спасибо за заказ!</h2>
            <p className="text-gray-600 mb-4">
              Ваш заказ успешно оформлен. В ближайшее время с вами свяжется представитель магазина для подтверждения деталей и организации доставки.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Способ оплаты:</strong> Банковский перевод<br/>
                После подтверждения заказа вам будут высланы реквизиты для оплаты.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Оформление заказа</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Товары в заказе */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ваш заказ</h3>
            <div className="space-y-3 mb-4">
              {state.items.map((item, index) => (
                <div key={`${item.product.id}-${item.size}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                    <p className="text-sm text-gray-600">Размер: {item.size} • Количество: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {((item.product.is_on_sale && item.product.sale_price ? item.product.sale_price : item.product.price) * item.quantity).toFixed(2)} руб.
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
              <span>Итого:</span>
              <span>{state.total.toFixed(2)} руб.</span>
            </div>
          </div>

          {/* Контактная информация */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Контактная информация
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Полное имя *
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.customer_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Иван Иванов"
                />
                {errors.customer_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон *
                </label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                    errors.customer_phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+7 (999) 123-45-67"
                />
                {errors.customer_phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.customer_phone}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (необязательно)
                </label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleInputChange('customer_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="ivan@example.com"
                />
              </div>
            </div>
          </div>

          {/* Доставка */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Доставка
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Способ доставки
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'boxberry', label: 'Boxberry', desc: 'Пункты выдачи' },
                  { value: 'russian_post', label: 'Почта России', desc: 'Доставка на дом' },
                  { value: 'cdek', label: 'СДЭК', desc: 'Быстрая доставка' }
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.delivery_method === method.value
                        ? 'border-black bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_method"
                      value={method.value}
                      checked={formData.delivery_method === method.value}
                      onChange={(e) => handleInputChange('delivery_method', e.target.value)}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{method.label}</div>
                      <div className="text-sm text-gray-600">{method.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Адрес доставки *
              </label>
              <textarea
                value={formData.delivery_address}
                onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.delivery_address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Укажите полный адрес доставки или адрес пункта выдачи"
              />
              {errors.delivery_address && (
                <p className="text-red-500 text-sm mt-1">{errors.delivery_address}</p>
              )}
            </div>
          </div>

          {/* Оплата */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Способ оплаты
            </h3>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="bank_transfer"
                  name="payment_method"
                  value="bank_transfer"
                  checked={true}
                  readOnly
                  className="mr-3"
                />
                <label htmlFor="bank_transfer" className="font-medium text-gray-900">
                  Банковский перевод
                </label>
              </div>
              <p className="text-sm text-blue-800 mt-2">
                После подтверждения заказа вам будут высланы реквизиты для оплаты. 
                Оплата производится переводом на карту или банковский счет.
              </p>
            </div>
          </div>

          {/* Кнопка отправки */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Оформление...' : 'Оформить заказ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}