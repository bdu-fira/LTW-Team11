// Chạy lệnh: node seed-addresses.js
const sequelize = require('./config/database');
const Address = require('./models/Address');
const Bank = require('./models/Bank');
const User = require('./models/User');

const seedAddresses = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        // Tìm user đầu tiên
        const user = await User.findOne();
        if (!user) {
            console.log('❌ Không tìm thấy user');
            return;
        }

        // Thêm địa chỉ mẫu
        await Address.bulkCreate([
            {
                userId: user.id,
                fullName: user.name,
                phone: user.phone || '0123456789',
                address: '123 Đường Lê Lợi',
                city: 'Hồ Chí Minh',
                district: 'Quận 1',
                ward: 'Phường Bến Nghé',
                isDefault: true
            },
            {
                userId: user.id,
                fullName: user.name,
                phone: user.phone || '0123456789',
                address: '456 Đường Nguyễn Huệ',
                city: 'Hồ Chí Minh',
                district: 'Quận 1',
                ward: 'Phường Bến Thành',
                isDefault: false
            }
        ]);

        // Thêm ngân hàng mẫu
        await Bank.bulkCreate([
            {
                userId: user.id,
                bankName: 'Vietcombank',
                accountNumber: '0071001234567',
                accountName: user.name,
                isDefault: true
            },
            {
                userId: user.id,
                bankName: 'Techcombank',
                accountNumber: '1903123456789',
                accountName: user.name,
                isDefault: false
            }
        ]);

        console.log('✅ Thêm dữ liệu mẫu thành công');
    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await sequelize.close();
    }
};

seedAddresses();