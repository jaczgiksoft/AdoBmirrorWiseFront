import { formatCurrency } from './formatCurrency';

export function generateTicketText(ticket) {
    const lines = [];

    lines.push('==============================');
    lines.push(`   ${ticket.clinic}`);
    lines.push('==============================');
    lines.push(`Fecha: ${new Date(ticket.date).toLocaleString()}`);
    lines.push(`Paciente: ${ticket.patient}`);
    lines.push('------------------------------');

    ticket.items.forEach(item => {
        const name = item.name.slice(0, 20).padEnd(20, ' ');
        const price = formatCurrency(item.total).padStart(10, ' ');
        lines.push(`${name}${price}`);
    });

    lines.push('------------------------------');
    lines.push(`TOTAL:    ${formatCurrency(ticket.total)}`);
    lines.push(`RECIBIDO: ${formatCurrency(ticket.received)}`);
    lines.push(`CAMBIO:   ${formatCurrency(ticket.change)}`);
    lines.push('------------------------------');
    lines.push('   Gracias por su preferencia');
    lines.push('==============================');

    return lines.join('\n');
}