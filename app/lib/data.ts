import { prisma } from './prisma';
import { EventsTable } from './definitions';

// 获取活动列表
export async function fetchEvents() {
    try {
        const events = await prisma.events.findMany({
            include: {
                organizer: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        // 转换为前端所需格式
        const formattedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            date: event.date.toISOString().split('T')[0],
            location: event.location,
            description: event.description || '',
            image_url: event.image_url || '',
            created_at: event.created_at ? event.created_at.toISOString() : '',
            organizer_name: event.organizer.name
        }));

        return formattedEvents as EventsTable[];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch events.');
    }
}

// 获取活动详情
export async function fetchEventById(id: string) {
    try {
        const event = await prisma.events.findUnique({
            where: {
                id
            },
            include: {
                organizer: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!event) {
            throw new Error('Event not found');
        }

        return {
            ...event,
            date: event.date.toISOString().split('T')[0],
            created_at: event.created_at ? event.created_at.toISOString() : '',
            description: event.description || '',
            image_url: event.image_url || '',
            organizer_name: event.organizer.name
        };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch event.');
    }
}

// 获取用户列表
export async function fetchUsers() {
    try {
        const users = await prisma.users.findMany({
            include: {
                _count: {
                    select: { 
                        events: true 
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        // 转换为前端所需格式
        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            events_count: user._count.events,
            // 不返回密码字段
        }));

        return formattedUsers;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch users.');
    }
}

// 获取用户详情
export async function fetchUserById(id: string) {
    try {
        const user = await prisma.users.findUnique({
            where: {
                id
            },
            include: {
                events: {
                    select: {
                        id: true,
                        title: true,
                        date: true
                    },
                    orderBy: {
                        date: 'desc'
                    }
                },
                _count: {
                    select: { 
                        events: true 
                    }
                }
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            events_count: user._count.events,
            events: user.events.map(event => ({
                id: event.id,
                title: event.title,
                date: event.date.toISOString().split('T')[0]
            }))
            // 不返回密码字段
        };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch user.');
    }
}
