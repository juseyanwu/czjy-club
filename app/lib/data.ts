import postgres from 'postgres';

import {
    EventsTable,
} from './definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// 获取活动列表
export async function fetchEvents() {
    try {
        const events = await sql<EventsTable[]>`
        SELECT 
          events.id,
          events.title,
          events.date,
          events.location,
          events.description,
          users.name as organizer_name,
          events.created_at
        FROM events
        JOIN users ON events.organizer_id = users.id
        ORDER BY events.date DESC
      `;

        return events;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch events.');
    }
}

// 获取活动详情
export async function fetchEventById(id: string) {
    try {
        const data = await sql<Event[]>`
        SELECT *
        FROM events
        WHERE id = ${id}
      `;

        return data[0];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch event.');
    }
}
