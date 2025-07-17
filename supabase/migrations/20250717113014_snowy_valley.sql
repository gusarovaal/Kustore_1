/*
  # Добавление поддержки множественных изображений для товаров

  1. Изменения в таблице products
    - Обновляем структуру для поддержки от 1 до 10 изображений
    - Добавляем валидацию количества изображений
    - Обеспечиваем совместимость с существующими данными

  2. Безопасность
    - Сохраняем существующие RLS политики
    - Добавляем проверки на количество изображений

  3. Совместимость
    - Миграция существующих данных
    - Поддержка старого формата image_url
*/

-- Добавляем функцию для валидации количества изображений
CREATE OR REPLACE FUNCTION validate_images_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Проверяем, что массив images содержит от 1 до 10 элементов
  IF array_length(NEW.images, 1) IS NULL OR array_length(NEW.images, 1) < 1 THEN
    RAISE EXCEPTION 'Товар должен содержать минимум 1 изображение';
  END IF;
  
  IF array_length(NEW.images, 1) > 10 THEN
    RAISE EXCEPTION 'Товар может содержать максимум 10 изображений';
  END IF;
  
  -- Проверяем, что все элементы массива не пустые
  IF EXISTS (SELECT 1 FROM unnest(NEW.images) AS img WHERE img IS NULL OR trim(img) = '') THEN
    RAISE EXCEPTION 'Все изображения должны иметь валидные пути';
  END IF;
  
  -- Автоматически устанавливаем image_url как первое изображение из массива
  IF NEW.images IS NOT NULL AND array_length(NEW.images, 1) > 0 THEN
    NEW.image_url = NEW.images[1];
  END IF;
  
  -- Автоматически создаем alt тексты если их нет
  IF NEW.image_alt_texts IS NULL OR array_length(NEW.image_alt_texts, 1) != array_length(NEW.images, 1) THEN
    NEW.image_alt_texts = array_fill(NEW.name, ARRAY[array_length(NEW.images, 1)]);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для валидации изображений
DROP TRIGGER IF EXISTS validate_product_images ON products;
CREATE TRIGGER validate_product_images
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_images_count();

-- Обновляем существующие записи для совместимости
DO $$
DECLARE
  product_record RECORD;
BEGIN
  -- Проходим по всем товарам и обновляем структуру изображений
  FOR product_record IN 
    SELECT id, image_url, images, image_alt_texts, name 
    FROM products 
  LOOP
    -- Если images пустой или null, но есть image_url
    IF (product_record.images IS NULL OR array_length(product_record.images, 1) IS NULL) 
       AND product_record.image_url IS NOT NULL THEN
      
      UPDATE products 
      SET 
        images = ARRAY[product_record.image_url],
        image_alt_texts = ARRAY[product_record.name]
      WHERE id = product_record.id;
      
    -- Если images есть, но нет alt текстов
    ELSIF product_record.images IS NOT NULL 
          AND array_length(product_record.images, 1) > 0
          AND (product_record.image_alt_texts IS NULL 
               OR array_length(product_record.image_alt_texts, 1) != array_length(product_record.images, 1)) THEN
      
      UPDATE products 
      SET image_alt_texts = array_fill(product_record.name, ARRAY[array_length(product_record.images, 1)])
      WHERE id = product_record.id;
      
    END IF;
  END LOOP;
END $$;

-- Добавляем комментарии к полям для документации
COMMENT ON COLUMN products.images IS 'Массив путей к изображениям товара (от 1 до 10 изображений)';
COMMENT ON COLUMN products.image_alt_texts IS 'Массив alt текстов для изображений (соответствует массиву images)';
COMMENT ON COLUMN products.image_url IS 'Основное изображение товара (автоматически устанавливается как первое из массива images)';