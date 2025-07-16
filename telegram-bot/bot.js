const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

// Конфигурация
const BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

// Инициализация
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Хранилище состояний пользователей
const userStates = new Map();

// Состояния для добавления товара
const ADD_PRODUCT_STATES = {
  WAITING_NAME: 'waiting_name',
  WAITING_PRICE: 'waiting_price',
  WAITING_SALE_PRICE: 'waiting_sale_price',
  WAITING_CATEGORY: 'waiting_category',
  WAITING_SUBCATEGORY: 'waiting_subcategory',
  WAITING_COLOR: 'waiting_color',
  WAITING_BRAND: 'waiting_brand',
  WAITING_DESCRIPTION: 'waiting_description',
  WAITING_SIZES: 'waiting_sizes',
  WAITING_STOCK: 'waiting_stock',
  WAITING_MEASUREMENTS: 'waiting_measurements',
  WAITING_IMAGES: 'waiting_images',
  WAITING_IS_NEW: 'waiting_is_new',
  WAITING_IS_ON_SALE: 'waiting_is_on_sale',
  CONFIRM: 'confirm'
};

// Состояния для редактирования товара
const EDIT_PRODUCT_STATES = {
  WAITING_PRODUCT_ID: 'waiting_product_id',
  WAITING_FIELD: 'waiting_field',
  WAITING_VALUE: 'waiting_value'
};

// Категории товаров
const CATEGORIES = [
  'shirts', 'jeans', 'dresses', 'sweaters', 
  'jackets', 'skirts', 'bags', 'shoes', 'accessories'
];

// Размеры по категориям
const SIZES_BY_CATEGORY = {
  'shirts': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'jeans': ['26', '27', '28', '29', '30', '31', '32', '33', '34', '36', '38'],
  'dresses': ['XS', 'S', 'M', 'L', 'XL'],
  'sweaters': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'jackets': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'skirts': ['XS', 'S', 'M', 'L', 'XL'],
  'bags': ['One Size'],
  'shoes': ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'],
  'accessories': ['One Size']
};

// Проверка администратора
function isAdmin(chatId) {
  return chatId.toString() === ADMIN_CHAT_ID;
}

// Главное меню
function getMainMenu() {
  return {
    reply_markup: {
      keyboard: [
        ['➕ Добавить товар', '✏️ Редактировать товар'],
        ['👁️ Скрыть товар', '📋 Список товаров'],
        ['📊 Статистика', '❌ Отмена']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

// Меню категорий
function getCategoryMenu() {
  const keyboard = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) {
    const row = [CATEGORIES[i]];
    if (CATEGORIES[i + 1]) row.push(CATEGORIES[i + 1]);
    keyboard.push(row);
  }
  keyboard.push(['❌ Отмена']);
  
  return {
    reply_markup: {
      keyboard,
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
}

// Меню размеров для категории
function getSizesMenu(category) {
  const sizes = SIZES_BY_CATEGORY[category] || ['XS', 'S', 'M', 'L', 'XL'];
  const keyboard = [];
  
  for (let i = 0; i < sizes.length; i += 3) {
    const row = sizes.slice(i, i + 3);
    keyboard.push(row);
  }
  keyboard.push(['✅ Готово', '❌ Отмена']);
  
  return {
    reply_markup: {
      keyboard,
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

// Меню да/нет
function getYesNoMenu() {
  return {
    reply_markup: {
      keyboard: [
        ['✅ Да', '❌ Нет']
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  if (!isAdmin(chatId)) {
    bot.sendMessage(chatId, '❌ У вас нет доступа к этому боту.');
    return;
  }
  
  bot.sendMessage(chatId, 
    '🛍️ *Добро пожаловать в панель управления KUSTORE!*\n\n' +
    'Выберите действие:', 
    { ...getMainMenu(), parse_mode: 'Markdown' }
  );
});

// Обработка сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (!isAdmin(chatId)) return;
  
  const userState = userStates.get(chatId) || {};
  
  try {
    // Главное меню
    if (text === '➕ Добавить товар') {
      await startAddProduct(chatId);
    } else if (text === '✏️ Редактировать товар') {
      await startEditProduct(chatId);
    } else if (text === '👁️ Скрыть товар') {
      await startHideProduct(chatId);
    } else if (text === '📋 Список товаров') {
      await showProductsList(chatId);
    } else if (text === '📊 Статистика') {
      await showStatistics(chatId);
    } else if (text === '❌ Отмена') {
      userStates.delete(chatId);
      bot.sendMessage(chatId, '✅ Операция отменена.', getMainMenu());
    }
    // Обработка состояний добавления товара
    else if (userState.action === 'add_product') {
      await handleAddProductState(chatId, text, userState);
    }
    // Обработка состояний редактирования товара
    else if (userState.action === 'edit_product') {
      await handleEditProductState(chatId, text, userState);
    }
    // Обработка скрытия товара
    else if (userState.action === 'hide_product') {
      await handleHideProductState(chatId, text, userState);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуйте еще раз.');
    userStates.delete(chatId);
  }
});

// Начать добавление товара
async function startAddProduct(chatId) {
  userStates.set(chatId, {
    action: 'add_product',
    state: ADD_PRODUCT_STATES.WAITING_NAME,
    product: {}
  });
  
  bot.sendMessage(chatId, 
    '➕ *Добавление нового товара*\n\n' +
    '📝 Введите название товара:', 
    { parse_mode: 'Markdown' }
  );
}

// Обработка состояний добавления товара
async function handleAddProductState(chatId, text, userState) {
  const { state, product } = userState;
  
  switch (state) {
    case ADD_PRODUCT_STATES.WAITING_NAME:
      product.name = text;
      userState.state = ADD_PRODUCT_STATES.WAITING_PRICE;
      bot.sendMessage(chatId, '💰 Введите цену товара (в рублях):');
      break;
      
    case ADD_PRODUCT_STATES.WAITING_PRICE:
      const price = parseFloat(text);
      if (isNaN(price) || price <= 0) {
        bot.sendMessage(chatId, '❌ Введите корректную цену (число больше 0):');
        return;
      }
      product.price = price;
      userState.state = ADD_PRODUCT_STATES.WAITING_SALE_PRICE;
      bot.sendMessage(chatId, 
        '🏷️ Введите цену со скидкой (или "нет" если скидки нет):'
      );
      break;
      
    case ADD_PRODUCT_STATES.WAITING_SALE_PRICE:
      if (text.toLowerCase() !== 'нет') {
        const salePrice = parseFloat(text);
        if (isNaN(salePrice) || salePrice <= 0) {
          bot.sendMessage(chatId, '❌ Введите корректную цену со скидкой или "нет":');
          return;
        }
        product.sale_price = salePrice;
      }
      userState.state = ADD_PRODUCT_STATES.WAITING_CATEGORY;
      bot.sendMessage(chatId, '📂 Выберите категорию товара:', getCategoryMenu());
      break;
      
    case ADD_PRODUCT_STATES.WAITING_CATEGORY:
      if (!CATEGORIES.includes(text)) {
        bot.sendMessage(chatId, '❌ Выберите категорию из предложенных:', getCategoryMenu());
        return;
      }
      product.category = text;
      userState.state = ADD_PRODUCT_STATES.WAITING_SUBCATEGORY;
      bot.sendMessage(chatId, 
        '📁 Введите подкategорию (или "нет" если не нужна):'
      );
      break;
      
    case ADD_PRODUCT_STATES.WAITING_SUBCATEGORY:
      if (text.toLowerCase() !== 'нет') {
        product.subcategory = text;
      }
      userState.state = ADD_PRODUCT_STATES.WAITING_COLOR;
      bot.sendMessage(chatId, '🎨 Введите цвет товара (или "нет"):');
      break;
      
    case ADD_PRODUCT_STATES.WAITING_COLOR:
      if (text.toLowerCase() !== 'нет') {
        product.color = text;
      }
      userState.state = ADD_PRODUCT_STATES.WAITING_BRAND;
      bot.sendMessage(chatId, '🏷️ Введите бренд (по умолчанию "KUSTORE"):');
      break;
      
    case ADD_PRODUCT_STATES.WAITING_BRAND:
      product.brand = text === 'нет' ? 'KUSTORE' : text;
      userState.state = ADD_PRODUCT_STATES.WAITING_DESCRIPTION;
      bot.sendMessage(chatId, '📝 Введите описание товара:');
      break;
      
    case ADD_PRODUCT_STATES.WAITING_DESCRIPTION:
      product.description = text;
      userState.state = ADD_PRODUCT_STATES.WAITING_SIZES;
      userState.selectedSizes = [];
      bot.sendMessage(chatId, 
        '📏 Выберите размеры (нажимайте на размеры, затем "Готово"):', 
        getSizesMenu(product.category)
      );
      break;
      
    case ADD_PRODUCT_STATES.WAITING_SIZES:
      if (text === '✅ Готово') {
        if (userState.selectedSizes.length === 0) {
          bot.sendMessage(chatId, '❌ Выберите хотя бы один размер!');
          return;
        }
        product.sizes = userState.selectedSizes;
        userState.state = ADD_PRODUCT_STATES.WAITING_STOCK;
        userState.stockIndex = 0;
        bot.sendMessage(chatId, 
          `📦 Введите количество на складе для размера ${product.sizes[0]}:`
        );
      } else if (SIZES_BY_CATEGORY[product.category]?.includes(text)) {
        if (!userState.selectedSizes.includes(text)) {
          userState.selectedSizes.push(text);
          bot.sendMessage(chatId, `✅ Размер ${text} добавлен. Выбрано: ${userState.selectedSizes.join(', ')}`);
        }
      }
      break;
      
    case ADD_PRODUCT_STATES.WAITING_STOCK:
      const stock = parseInt(text);
      if (isNaN(stock) || stock < 0) {
        bot.sendMessage(chatId, '❌ Введите корректное количество (число >= 0):');
        return;
      }
      
      if (!product.stock_quantity) product.stock_quantity = {};
      product.stock_quantity[product.sizes[userState.stockIndex]] = stock;
      
      userState.stockIndex++;
      if (userState.stockIndex < product.sizes.length) {
        bot.sendMessage(chatId, 
          `📦 Введите количество на складе для размера ${product.sizes[userState.stockIndex]}:`
        );
      } else {
        userState.state = ADD_PRODUCT_STATES.WAITING_IMAGES;
        bot.sendMessage(chatId, 
          '🖼️ Введите пути к изображениям через запятую\n' +
          'Пример: /images/products/shirts/shirt1.jpg, /images/products/shirts/shirt2.jpg'
        );
      }
      break;
      
    case ADD_PRODUCT_STATES.WAITING_IMAGES:
      const imagePaths = text.split(',').map(path => path.trim());
      product.images = imagePaths;
      product.image_url = imagePaths[0]; // Первое изображение как основное
      product.image_alt_texts = imagePaths.map(() => product.name);
      
      userState.state = ADD_PRODUCT_STATES.WAITING_IS_NEW;
      bot.sendMessage(chatId, '🆕 Это новинка?', getYesNoMenu());
      break;
      
    case ADD_PRODUCT_STATES.WAITING_IS_NEW:
      product.is_new = text === '✅ Да';
      userState.state = ADD_PRODUCT_STATES.WAITING_IS_ON_SALE;
      bot.sendMessage(chatId, '🏷️ Товар участвует в распродаже?', getYesNoMenu());
      break;
      
    case ADD_PRODUCT_STATES.WAITING_IS_ON_SALE:
      product.is_on_sale = text === '✅ Да';
      product.in_stock = true; // По умолчанию в наличии
      
      userState.state = ADD_PRODUCT_STATES.CONFIRM;
      await showProductPreview(chatId, product);
      break;
      
    case ADD_PRODUCT_STATES.CONFIRM:
      if (text === '✅ Сохранить') {
        await saveProduct(chatId, product);
      } else if (text === '❌ Отменить') {
        userStates.delete(chatId);
        bot.sendMessage(chatId, '❌ Добавление товара отменено.', getMainMenu());
      } else {
        bot.sendMessage(chatId, '❌ Выберите "Сохранить" или "Отменить".');
      }
      break;
  }
  
  userStates.set(chatId, userState);
}

// Показать превью товара
async function showProductPreview(chatId, product) {
  const preview = `
🛍️ *Превью товара:*

📝 *Название:* ${product.name}
💰 *Цена:* ${product.price} руб.
${product.sale_price ? `🏷️ *Цена со скидкой:* ${product.sale_price} руб.\n` : ''}
📂 *Категория:* ${product.category}
${product.subcategory ? `📁 *Подкатегория:* ${product.subcategory}\n` : ''}
${product.color ? `🎨 *Цвет:* ${product.color}\n` : ''}
🏷️ *Бренд:* ${product.brand}
📝 *Описание:* ${product.description}
📏 *Размеры:* ${product.sizes.join(', ')}
📦 *Остатки:* ${Object.entries(product.stock_quantity).map(([size, qty]) => `${size}: ${qty}`).join(', ')}
🖼️ *Изображения:* ${product.images.length} шт.
🆕 *Новинка:* ${product.is_new ? 'Да' : 'Нет'}
🏷️ *Распродажа:* ${product.is_on_sale ? 'Да' : 'Нет'}
  `;
  
  bot.sendMessage(chatId, preview, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        ['✅ Сохранить', '❌ Отменить']
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
}

// Сохранить товар в базу данных
async function saveProduct(chatId, product) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select();
    
    if (error) throw error;
    
    userStates.delete(chatId);
    bot.sendMessage(chatId, 
      `✅ *Товар успешно добавлен!*\n\n` +
      `🆔 ID: ${data[0].id}\n` +
      `📝 Название: ${product.name}`, 
      { ...getMainMenu(), parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error saving product:', error);
    bot.sendMessage(chatId, 
      `❌ Ошибка при сохранении товара: ${error.message}\n\n` +
      'Попробуйте еще раз.'
    );
  }
}

// Начать редактирование товара
async function startEditProduct(chatId) {
  userStates.set(chatId, {
    action: 'edit_product',
    state: EDIT_PRODUCT_STATES.WAITING_PRODUCT_ID
  });
  
  bot.sendMessage(chatId, 
    '✏️ *Редактирование товара*\n\n' +
    '🆔 Введите ID товара или часть названия для поиска:', 
    { parse_mode: 'Markdown' }
  );
}

// Обработка редактирования товара
async function handleEditProductState(chatId, text, userState) {
  const { state } = userState;
  
  switch (state) {
    case EDIT_PRODUCT_STATES.WAITING_PRODUCT_ID:
      await findAndSelectProduct(chatId, text, userState);
      break;
      
    case EDIT_PRODUCT_STATES.WAITING_FIELD:
      await selectFieldToEdit(chatId, text, userState);
      break;
      
    case EDIT_PRODUCT_STATES.WAITING_VALUE:
      await updateProductField(chatId, text, userState);
      break;
  }
}

// Найти и выбрать товар для редактирования
async function findAndSelectProduct(chatId, searchTerm, userState) {
  try {
    let query = supabase.from('products').select('*');
    
    // Если это UUID, ищем по ID
    if (searchTerm.length === 36 && searchTerm.includes('-')) {
      query = query.eq('id', searchTerm);
    } else {
      // Иначе ищем по названию
      query = query.ilike('name', `%${searchTerm}%`);
    }
    
    const { data, error } = await query.limit(10);
    
    if (error) throw error;
    
    if (data.length === 0) {
      bot.sendMessage(chatId, '❌ Товары не найдены. Попробуйте другой запрос:');
      return;
    }
    
    if (data.length === 1) {
      userState.product = data[0];
      userState.state = EDIT_PRODUCT_STATES.WAITING_FIELD;
      await showEditMenu(chatId, data[0]);
    } else {
      // Показать список найденных товаров
      let message = '📋 *Найденные товары:*\n\n';
      data.forEach((product, index) => {
        message += `${index + 1}. ${product.name} (${product.price} руб.)\n`;
        message += `   ID: \`${product.id}\`\n\n`;
      });
      message += 'Введите точный ID товара для редактирования:';
      
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
    
    userStates.set(chatId, userState);
  } catch (error) {
    console.error('Error finding product:', error);
    bot.sendMessage(chatId, '❌ Ошибка поиска товара. Попробуйте еще раз.');
  }
}

// Показать меню редактирования
async function showEditMenu(chatId, product) {
  const message = `
✏️ *Редактирование товара:*
📝 ${product.name}

Выберите поле для редактирования:
  `;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        ['📝 Название', '💰 Цена'],
        ['🏷️ Цена со скидкой', '📂 Категория'],
        ['🎨 Цвет', '📝 Описание'],
        ['📏 Размеры', '📦 Остатки'],
        ['🆕 Новинка', '🏷️ Распродажа'],
        ['👁️ Скрыть/Показать', '❌ Отмена']
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
}

// Выбрать поле для редактирования
async function selectFieldToEdit(chatId, fieldName, userState) {
  const fieldMap = {
    '📝 Название': 'name',
    '💰 Цена': 'price',
    '🏷️ Цена со скидкой': 'sale_price',
    '📂 Категория': 'category',
    '🎨 Цвет': 'color',
    '📝 Описание': 'description',
    '📏 Размеры': 'sizes',
    '📦 Остатки': 'stock_quantity',
    '🆕 Новинка': 'is_new',
    '🏷️ Распродажа': 'is_on_sale',
    '👁️ Скрыть/Показать': 'in_stock'
  };
  
  const field = fieldMap[fieldName];
  if (!field) {
    bot.sendMessage(chatId, '❌ Выберите поле из предложенных.');
    return;
  }
  
  userState.editField = field;
  userState.state = EDIT_PRODUCT_STATES.WAITING_VALUE;
  
  let prompt = '';
  const currentValue = userState.product[field];
  
  switch (field) {
    case 'name':
      prompt = `📝 Текущее название: ${currentValue}\nВведите новое название:`;
      break;
    case 'price':
      prompt = `💰 Текущая цена: ${currentValue} руб.\nВведите новую цену:`;
      break;
    case 'sale_price':
      prompt = `🏷️ Текущая цена со скидкой: ${currentValue || 'не установлена'}\nВведите новую цену со скидкой (или "удалить"):`;
      break;
    case 'category':
      prompt = `📂 Текущая категория: ${currentValue}\nВыберите новую категорию:`;
      bot.sendMessage(chatId, prompt, getCategoryMenu());
      return;
    case 'color':
      prompt = `🎨 Текущий цвет: ${currentValue || 'не указан'}\nВведите новый цвет:`;
      break;
    case 'description':
      prompt = `📝 Текущее описание: ${currentValue}\nВведите новое описание:`;
      break;
    case 'is_new':
    case 'is_on_sale':
    case 'in_stock':
      const labels = {
        'is_new': 'новинка',
        'is_on_sale': 'участие в распродаже',
        'in_stock': 'наличие на складе'
      };
      prompt = `Текущее значение (${labels[field]}): ${currentValue ? 'Да' : 'Нет'}\nИзменить на:`;
      bot.sendMessage(chatId, prompt, getYesNoMenu());
      return;
    default:
      prompt = `Введите новое значение для поля ${fieldName}:`;
  }
  
  bot.sendMessage(chatId, prompt);
  userStates.set(chatId, userState);
}

// Обновить поле товара
async function updateProductField(chatId, newValue, userState) {
  try {
    const { product, editField } = userState;
    let processedValue = newValue;
    
    // Обработка значений по типу поля
    switch (editField) {
      case 'price':
        processedValue = parseFloat(newValue);
        if (isNaN(processedValue) || processedValue <= 0) {
          bot.sendMessage(chatId, '❌ Введите корректную цену (число больше 0):');
          return;
        }
        break;
        
      case 'sale_price':
        if (newValue.toLowerCase() === 'удалить') {
          processedValue = null;
        } else {
          processedValue = parseFloat(newValue);
          if (isNaN(processedValue) || processedValue <= 0) {
            bot.sendMessage(chatId, '❌ Введите корректную цену или "удалить":');
            return;
          }
        }
        break;
        
      case 'is_new':
      case 'is_on_sale':
      case 'in_stock':
        processedValue = newValue === '✅ Да';
        break;
    }
    
    // Обновляем товар в базе данных
    const { error } = await supabase
      .from('products')
      .update({ [editField]: processedValue })
      .eq('id', product.id);
    
    if (error) throw error;
    
    userStates.delete(chatId);
    bot.sendMessage(chatId, 
      `✅ *Товар успешно обновлен!*\n\n` +
      `📝 Товар: ${product.name}\n` +
      `🔄 Поле: ${editField}\n` +
      `✨ Новое значение: ${processedValue}`, 
      { ...getMainMenu(), parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error updating product:', error);
    bot.sendMessage(chatId, 
      `❌ Ошибка при обновлении товара: ${error.message}`
    );
  }
}

// Начать скрытие товара
async function startHideProduct(chatId) {
  userStates.set(chatId, {
    action: 'hide_product'
  });
  
  bot.sendMessage(chatId, 
    '👁️ *Скрыть/показать товар*\n\n' +
    '🆔 Введите ID товара или часть названия:', 
    { parse_mode: 'Markdown' }
  );
}

// Обработка скрытия товара
async function handleHideProductState(chatId, text, userState) {
  await findAndToggleProductVisibility(chatId, text);
}

// Найти и переключить видимость товара
async function findAndToggleProductVisibility(chatId, searchTerm) {
  try {
    let query = supabase.from('products').select('*');
    
    if (searchTerm.length === 36 && searchTerm.includes('-')) {
      query = query.eq('id', searchTerm);
    } else {
      query = query.ilike('name', `%${searchTerm}%`);
    }
    
    const { data, error } = await query.limit(10);
    
    if (error) throw error;
    
    if (data.length === 0) {
      bot.sendMessage(chatId, '❌ Товары не найдены.');
      return;
    }
    
    if (data.length === 1) {
      const product = data[0];
      const newStatus = !product.in_stock;
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ in_stock: newStatus })
        .eq('id', product.id);
      
      if (updateError) throw updateError;
      
      userStates.delete(chatId);
      bot.sendMessage(chatId, 
        `✅ *Статус товара изменен!*\n\n` +
        `📝 Товар: ${product.name}\n` +
        `👁️ Статус: ${newStatus ? 'Показан' : 'Скрыт'}`, 
        { ...getMainMenu(), parse_mode: 'Markdown' }
      );
    } else {
      let message = '📋 *Найденные товары:*\n\n';
      data.forEach((product, index) => {
        const status = product.in_stock ? '👁️ Показан' : '🙈 Скрыт';
        message += `${index + 1}. ${product.name} - ${status}\n`;
        message += `   ID: \`${product.id}\`\n\n`;
      });
      message += 'Введите точный ID товара:';
      
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error toggling product visibility:', error);
    bot.sendMessage(chatId, '❌ Ошибка при изменении статуса товара.');
  }
}

// Показать список товаров
async function showProductsList(chatId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, category, in_stock')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    if (data.length === 0) {
      bot.sendMessage(chatId, '📋 Товары не найдены.');
      return;
    }
    
    let message = '📋 *Список товаров (последние 20):*\n\n';
    data.forEach((product, index) => {
      const status = product.in_stock ? '✅' : '❌';
      message += `${index + 1}. ${status} ${product.name}\n`;
      message += `   💰 ${product.price} руб. | 📂 ${product.category}\n`;
      message += `   🆔 \`${product.id}\`\n\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching products list:', error);
    bot.sendMessage(chatId, '❌ Ошибка при получении списка товаров.');
  }
}

// Показать статистику
async function showStatistics(chatId) {
  try {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (productsError) throw productsError;
    if (ordersError) throw ordersError;
    
    const totalProducts = products.length;
    const visibleProducts = products.filter(p => p.in_stock).length;
    const newProducts = products.filter(p => p.is_new).length;
    const saleProducts = products.filter(p => p.is_on_sale).length;
    
    const totalOrders = orders.length;
    const newOrders = orders.filter(o => o.status === 'new').length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
    
    const message = `
📊 *Статистика магазина:*

🛍️ *Товары:*
• Всего товаров: ${totalProducts}
• Видимых: ${visibleProducts}
• Новинок: ${newProducts}
• В распродаже: ${saleProducts}

📦 *Заказы:*
• Всего заказов: ${totalOrders}
• Новых: ${newOrders}
• Выполненных: ${completedOrders}

💰 *Выручка:*
• Общая выручка: ${totalRevenue.toFixed(2)} руб.
• Средний чек: ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0} руб.
    `;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    bot.sendMessage(chatId, '❌ Ошибка при получении статистики.');
  }
}

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 Telegram Admin Bot запущен!');