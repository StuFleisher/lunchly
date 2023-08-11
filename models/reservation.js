"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");
const Customer = require("./customer");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this._numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** Set _numGuests or throw an error if arg is less than 1 */
  set numGuests(numGuests){
    if (numGuests<1){
      throw new Error("There must be at least 1 guest");
    }
    this._numGuests = numGuests;
  }

  /** numGuest getter */
  get numGuests(){
    return this._numGuests;
  }

  

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }


  // Updates the database with data from this instance

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.startAt, this._numGuests, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      //TODO: Think about - do we need to save customer ID?
      await db.query(
        `UPDATE reservations
             SET customer_id=$1,
                 start_at=$2,
                 num_guests=$3,
                 notes=$4
             WHERE id = $5`, [
        this.customerId,
        this.startAt,
        this._numGuests,
        this.notes,
        this.id,
      ],
      );
    }
  }



}




module.exports = Reservation;
