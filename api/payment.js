const processTbankPayment = async () => {
  try {
    console.log('🔄 Отправка платежа...');
    
    const response = await fetch(API_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        email: email,
        username: username
      })
    });

    const result = await response.json();
    console.log('📦 Данные ответа:', result);

    if (result.success && result.paymentData) {
      setPaymentStatus({
        type: 'success',
        message: `Создан тестовый платеж. Заказ №${result.orderId}`
      });

      // Сохраняем данные
      localStorage.setItem('lastPayment', JSON.stringify({
        orderId: result.orderId,
        amount: amount,
        username: username,
        email: email,
        timestamp: Date.now()
      }));

      // Открываем виджет Тинькофф
      openTinkoffWidget(result.paymentData);

    } else {
      throw new Error(result.error || 'Неизвестная ошибка от сервера');
    }

  } catch (error) {
    console.error('🔥 Ошибка платежа:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ошибка соединения с сервером платежей';
    setPaymentStatus({ type: 'error', message: errorMessage });
    throw error;
  }
};

// Функция для открытия виджета Тинькофф
const openTinkoffWidget = (paymentData: any) => {
  // Создаем форму для Тинькофф
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://securepay.tinkoff.ru/e2c/v2/Init';
  form.style.display = 'none';

  // Добавляем все необходимые поля
  const fields = {
    TerminalKey: paymentData.TerminalKey,
    OrderId: paymentData.OrderId,
    Amount: paymentData.Amount.toString(),
    Description: paymentData.Description,
    CustomerKey: paymentData.CustomerKey,
    SuccessURL: paymentData.SuccessURL,
    FailURL: paymentData.FailURL,
    DATA: paymentData.DATA,
    // Для тестового режима Token может быть пустым
    Token: ''
  };

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  
  // Отправляем форму
  setTimeout(() => {
    form.submit();
  }, 1000);
};