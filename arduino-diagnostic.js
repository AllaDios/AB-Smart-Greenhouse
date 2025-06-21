import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

async function diagnoseArduino() {
  console.log('🔍 Diagnóstico de Arduino - SmartGreenhouse');
  console.log('==========================================\n');

  try {
    // 1. Listar todos los puertos disponibles
    console.log('1. Puertos disponibles:');
    const ports = await SerialPort.list();
    
    if (ports.length === 0) {
      console.log('   ❌ No se encontraron puertos seriales');
      return;
    }

    ports.forEach((port, index) => {
      console.log(`   ${index + 1}. ${port.path}`);
      console.log(`      Fabricante: ${port.manufacturer || 'Desconocido'}`);
      console.log(`      Nombre: ${port.friendlyName || 'Sin nombre'}`);
      console.log(`      ID: ${port.pnpId || 'Sin ID'}`);
      console.log(`      ID de producto: ${port.productId || 'Sin ID de producto'}`);
      console.log(`      ID de vendedor: ${port.vendorId || 'Sin ID de vendedor'}`);
      console.log('');
    });

    // 2. Filtrar puertos que podrían ser Arduino
    console.log('2. Puertos que podrían ser Arduino:');
    const arduinoPorts = ports.filter(port => {
      const manufacturer = (port.manufacturer || '').toLowerCase();
      const friendlyName = (port.friendlyName || '').toLowerCase();
      const path = port.path.toLowerCase();
      
      return manufacturer.includes('arduino') ||
             manufacturer.includes('ch340') ||
             manufacturer.includes('ftdi') ||
             friendlyName.includes('usb-serial ch340') ||
             friendlyName.includes('arduino') ||
             path.includes('com') ||
             path.includes('ttyusb') ||
             path.includes('ttyacm');
    });

    if (arduinoPorts.length === 0) {
      console.log('   ❌ No se encontraron puertos que parezcan ser Arduino');
      console.log('   💡 Posibles causas:');
      console.log('      - Arduino no está conectado');
      console.log('      - Drivers no instalados (CH340/FTDI)');
      console.log('      - Arduino no está en modo programación');
      console.log('      - Puerto ocupado por otro programa');
    } else {
      arduinoPorts.forEach((port, index) => {
        console.log(`   ✅ ${index + 1}. ${port.path} - ${port.friendlyName || port.manufacturer}`);
      });
    }

    // 3. Intentar conectar al primer puerto Arduino encontrado
    if (arduinoPorts.length > 0) {
      console.log('\n3. Probando conexión con Arduino:');
      const testPort = arduinoPorts[0];
      console.log(`   Intentando conectar a: ${testPort.path}`);
      
      const port = new SerialPort({
        path: testPort.path,
        baudRate: 9600,
        autoOpen: false
      });

      try {
        await new Promise((resolve, reject) => {
          port.open((err) => {
            if (err) {
              console.log(`   ❌ Error al conectar: ${err.message}`);
              reject(err);
            } else {
              console.log(`   ✅ Conexión exitosa a ${testPort.path}`);
              resolve();
            }
          });
        });

        // Configurar parser para leer datos
        const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

        console.log('   📡 Esperando datos del Arduino (10 segundos)...');
        
        let dataReceived = false;
        const timeout = setTimeout(() => {
          if (!dataReceived) {
            console.log('   ⏰ No se recibieron datos del Arduino');
            console.log('   💡 Posibles causas:');
            console.log('      - Arduino no está enviando datos');
            console.log('      - Código Arduino no está cargado');
            console.log('      - Velocidad de baudios incorrecta');
            console.log('      - Formato de datos incorrecto');
          }
          port.close();
        }, 10000);

        parser.on('data', (line) => {
          dataReceived = true;
          clearTimeout(timeout);
          console.log(`   📨 Datos recibidos: "${line.trim()}"`);
          port.close();
        });

      } catch (error) {
        console.log(`   ❌ Error en la prueba: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error.message);
  }

  console.log('\n📋 Resumen de problemas comunes:');
  console.log('1. Arduino no conectado físicamente');
  console.log('2. Drivers CH340/FTDI no instalados');
  console.log('3. Puerto ocupado por Arduino IDE o Monitor Serial');
  console.log('4. Código Arduino no cargado o incorrecto');
  console.log('5. Velocidad de baudios incorrecta (debe ser 9600)');
  console.log('6. Formato de datos incorrecto');
  console.log('7. Permisos de puerto en Linux/macOS');
}

diagnoseArduino().catch(console.error); 