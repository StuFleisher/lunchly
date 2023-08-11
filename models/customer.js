"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {

    // need to account for non-integer values in path
    // TODO: move this to the route
    if (isNaN(Number(id))) {
      const err = new Error(`Resource does not exist.`);
      err.status = 404;
      throw err;
    }

    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }


  /** Retrieves the 10 customers with the most reservations on file */
  // TODO: Format SQL statement to be readable
  static async getBestCustomers() {
    const results = await db.query(
      `SELECT
      COUNT(r.id) AS "resCount",
      c.id as id,
      first_name AS "firstName",
      last_name AS "lastName",
      phone,
      c.notes as notes
      FROM reservations as r JOIN customers as c on r.customer_id = c.id
      GROUP BY c.id
      ORDER BY "resCount" desc
      LIMIT 10`
    );

    return results.rows.map(c =>
      new Customer(c));
  }

  /** returns a list of customers whose name includes the search term */

  static async search(search) {
    const results = await db.query(
      `SELECT id,
        first_name AS "firstName",
        last_name  AS "lastName",
        phone,
        notes
      FROM customers
      WHERE CONCAT(first_name, ' ', last_name) ILIKE $1
      ORDER BY last_name, first_name`,
      [`%${search}%`]
    );
    return results.rows.map(c => new Customer(c));
  }


  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  // TODO: fix doc strings below
  /** save this customer. */

  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }
}

module.exports = Customer;
