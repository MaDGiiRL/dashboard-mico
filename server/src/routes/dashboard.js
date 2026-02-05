import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

function isWeekday(date) {
    const w = date.getUTCDay(); // 0 dom .. 6 sab
    return w >= 1 && w <= 5;
}
function isWeekend(date) {
    const w = date.getUTCDay();
    return w === 0 || w === 6;
}

export async function dashboardRoutes(app) {
    app.get("/days/:day/dashboard", async (req, reply) => {
        try {
            requireRole(["admin", "editor", "viewer"])(req);
            const params = z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(req.params);
            const day = params.day;

            await q(`insert into op_days(day) values($1) on conflict (day) do nothing`, [day]);

            const d = new Date(day + "T00:00:00Z");

            const races = await q(`select * from races where day=$1 order by starts_at asc`, [day]);
            const appointments = await q(`select * from appointments where day=$1 order by starts_at asc`, [day]);
            const weather = await q(`select * from weather_bulletins where day=$1 order by created_at desc`, [day]);
            const issuesOpen = await q(
                `select * from issues
         where (day=$1 or day is null) and status in ('aperta','in_lavorazione')
         order by severity desc, updated_at desc`,
                [day]
            );

            const coc = await q(
                `select cs.*, cc.name as commune_name
         from coc_status cs
         join coc_communes cc on cc.id = cs.commune_id
         where cs.day=$1
         order by cc.name asc`,
                [day]
            );

            const safetyRoom = await q(
                `select * from safety_room_presence where day=$1 and is_present=true order by person_name asc`,
                [day]
            );

            const contingents = await q(`select * from contingents where day=$1`, [day]);
            const contingentTeams = await q(
                `select ct.*, c.site
         from contingent_teams ct
         join contingents c on c.id = ct.contingent_id
         where c.day=$1
         order by ct.team_name asc`,
                [day]
            );

            const aibOncall = await q(`select * from aib_oncall where day=$1 order by person_name asc`, [day]);

            const aibWeekdayTeams = isWeekday(d)
                ? await q(`select * from aib_weekday_teams where day=$1 order by location asc, team_name asc`, [day])
                : [];

            const weekendVolunteers = isWeekend(d)
                ? await q(`select * from volunteer_weekend_teams where day=$1 order by team_name asc`, [day])
                : [];

            const vehiclesOut = await q(
                `select vd.*, v.name as vehicle_name, v.code as vehicle_code
         from vehicle_deployments vd
         join vehicles v on v.id = vd.vehicle_id
         where vd.day=$1 and vd.is_out=true
         order by v.name asc`,
                [day]
            );

            const mapFeatures = await q(
                `select * from map_features where day=$1 and is_active=true order by updated_at desc`,
                [day]
            );

            return {
                day,
                races,
                appointments,
                coc,
                safetyRoom,
                contingents,
                contingentTeams,
                aib: { oncall: aibOncall, weekdayTeams: aibWeekdayTeams, weekendVolunteers },
                vehiclesOut,
                weather,
                issuesOpen,
                mapFeatures,
            };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });
}
