const { EventEmitter } = require('events');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const emailService = require('./emailService');
const whatsappService = require('./whatsappService');

class WorkflowEngine extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
    this._registerHandlers();
  }

  _registerHandlers() {
    const events = [
      'lead.created',
      'lead.score_changed',
      'lead.status_changed',
      'payment.completed',
    ];
    for (const evt of events) {
      this.on(evt, (payload) => this._handleEvent(evt, payload).catch((e) =>
        console.error(`[Workflow] Error handling ${evt}:`, e.message)
      ));
    }
  }

  async _handleEvent(eventName, payload) {
    const institution_id = payload.institution_id;
    if (!institution_id) return;

    const workflows = await prisma.workflow.findMany({
      where: { institution_id, trigger_event: eventName, is_active: true },
    });

    for (const workflow of workflows) {
      let conditions = {};
      try { conditions = JSON.parse(workflow.trigger_conditions); } catch (_) {}

      if (!this._checkConditions(conditions, payload)) continue;

      let steps = [];
      try { steps = JSON.parse(workflow.steps); } catch (_) {}

      console.log(`[Workflow] Executing "${workflow.name}" (${steps.length} steps)`);
      this._executeSteps(steps, payload, institution_id).catch((e) =>
        console.error(`[Workflow] Step execution error:`, e.message)
      );
    }
  }

  _checkConditions(conditions, payload) {
    for (const [key, value] of Object.entries(conditions)) {
      if (payload[key] !== value) return false;
    }
    return true;
  }

  async _executeSteps(steps, payload, institution_id) {
    for (const step of steps) {
      try {
        await this._executeStep(step, payload, institution_id);
      } catch (e) {
        console.error(`[Workflow] Step "${step.type}" error:`, e.message);
      }
    }
  }

  async _executeStep(step, payload, institution_id) {
    const lead_id = payload.lead_id || payload.id;

    switch (step.type) {
      case 'send_email':
        if (lead_id && step.template_id) {
          await emailService.sendEmail({
            lead_id,
            template_id: step.template_id,
            institution_id,
            custom_variables: step.variables || {},
          });
        }
        break;

      case 'send_whatsapp':
        if (lead_id && step.template_id) {
          await whatsappService.send({
            lead_id,
            template_id: step.template_id,
            institution_id,
            variables: step.variables || {},
          });
        }
        break;

      case 'assign_counsellor':
        if (lead_id && step.user_id) {
          await prisma.lead.updateMany({
            where: { id: lead_id, institution_id },
            data: { assigned_to: step.user_id },
          });
        }
        break;

      case 'change_status':
        if (lead_id && step.status) {
          await prisma.lead.updateMany({
            where: { id: lead_id, institution_id },
            data: { status: step.status },
          });
        }
        break;

      case 'add_task':
        if (lead_id) {
          const assigned_to = step.assigned_to || payload.assigned_to;
          if (assigned_to) {
            await prisma.task.create({
              data: {
                lead_id,
                assigned_to,
                title: step.title || 'Follow up',
                due_at: new Date(Date.now() + (step.due_hours || 24) * 60 * 60 * 1000),
              },
            });
          }
        }
        break;

      case 'wait_hours': {
        const hours = step.hours || 1;
        await new Promise((resolve) => setTimeout(resolve, hours * 60 * 60 * 1000));
        break;
      }

      default:
        console.warn(`[Workflow] Unknown step type: ${step.type}`);
    }
  }
}

// Singleton
const workflowEngine = new WorkflowEngine();
module.exports = workflowEngine;
