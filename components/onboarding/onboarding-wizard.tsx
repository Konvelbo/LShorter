"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Search, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import gsap from "gsap";
import { useSession } from "next-auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { showToast } from "@/components/ui/toast-provider";

// Utilise flagcdn.com pour les vrais drapeaux (images PNG haute qualite)
// Format: flag = URL de l'image du drapeau (a utiliser dans <img src={flag} />)
const ALL_COUNTRIES = [
  { code: "AF", name: "Afghanistan", flag: "https://flagcdn.com/w80/af.png" },
  { code: "AL", name: "Albania", flag: "https://flagcdn.com/w80/al.png" },
  { code: "DZ", name: "Algeria", flag: "https://flagcdn.com/w80/dz.png" },
  {
    code: "AS",
    name: "American Samoa",
    flag: "https://flagcdn.com/w80/as.png",
  },
  { code: "AD", name: "Andorra", flag: "https://flagcdn.com/w80/ad.png" },
  { code: "AO", name: "Angola", flag: "https://flagcdn.com/w80/ao.png" },
  { code: "AI", name: "Anguilla", flag: "https://flagcdn.com/w80/ai.png" },
  { code: "AQ", name: "Antarctica", flag: "https://flagcdn.com/w80/aq.png" },
  {
    code: "AG",
    name: "Antigua and Barbuda",
    flag: "https://flagcdn.com/w80/ag.png",
  },
  { code: "AR", name: "Argentina", flag: "https://flagcdn.com/w80/ar.png" },
  { code: "AM", name: "Armenia", flag: "https://flagcdn.com/w80/am.png" },
  { code: "AW", name: "Aruba", flag: "https://flagcdn.com/w80/aw.png" },
  { code: "AU", name: "Australia", flag: "https://flagcdn.com/w80/au.png" },
  { code: "AT", name: "Austria", flag: "https://flagcdn.com/w80/at.png" },
  { code: "AZ", name: "Azerbaijan", flag: "https://flagcdn.com/w80/az.png" },
  { code: "BS", name: "Bahamas", flag: "https://flagcdn.com/w80/bs.png" },
  { code: "BH", name: "Bahrain", flag: "https://flagcdn.com/w80/bh.png" },
  { code: "BD", name: "Bangladesh", flag: "https://flagcdn.com/w80/bd.png" },
  { code: "BB", name: "Barbados", flag: "https://flagcdn.com/w80/bb.png" },
  { code: "BY", name: "Belarus", flag: "https://flagcdn.com/w80/by.png" },
  { code: "BE", name: "Belgium", flag: "https://flagcdn.com/w80/be.png" },
  { code: "BZ", name: "Belize", flag: "https://flagcdn.com/w80/bz.png" },
  { code: "BJ", name: "Benin", flag: "https://flagcdn.com/w80/bj.png" },
  { code: "BM", name: "Bermuda", flag: "https://flagcdn.com/w80/bm.png" },
  { code: "BT", name: "Bhutan", flag: "https://flagcdn.com/w80/bt.png" },
  {
    code: "BO",
    name: "Bolivia, Plurinational State of",
    flag: "https://flagcdn.com/w80/bo.png",
  },
  {
    code: "BQ",
    name: "Bonaire, Sint Eustatius and Saba",
    flag: "https://flagcdn.com/w80/bq.png",
  },
  {
    code: "BA",
    name: "Bosnia and Herzegovina",
    flag: "https://flagcdn.com/w80/ba.png",
  },
  { code: "BW", name: "Botswana", flag: "https://flagcdn.com/w80/bw.png" },
  { code: "BV", name: "Bouvet Island", flag: "https://flagcdn.com/w80/bv.png" },
  { code: "BR", name: "Brazil", flag: "https://flagcdn.com/w80/br.png" },
  {
    code: "IO",
    name: "British Indian Ocean Territory",
    flag: "https://flagcdn.com/w80/io.png",
  },
  {
    code: "BN",
    name: "Brunei Darussalam",
    flag: "https://flagcdn.com/w80/bn.png",
  },
  { code: "BG", name: "Bulgaria", flag: "https://flagcdn.com/w80/bg.png" },
  { code: "BF", name: "Burkina Faso", flag: "https://flagcdn.com/w80/bf.png" },
  { code: "BI", name: "Burundi", flag: "https://flagcdn.com/w80/bi.png" },
  { code: "CV", name: "Cabo Verde", flag: "https://flagcdn.com/w80/cv.png" },
  { code: "KH", name: "Cambodia", flag: "https://flagcdn.com/w80/kh.png" },
  { code: "CM", name: "Cameroon", flag: "https://flagcdn.com/w80/cm.png" },
  { code: "CA", name: "Canada", flag: "https://flagcdn.com/w80/ca.png" },
  {
    code: "KY",
    name: "Cayman Islands",
    flag: "https://flagcdn.com/w80/ky.png",
  },
  {
    code: "CF",
    name: "Central African Republic",
    flag: "https://flagcdn.com/w80/cf.png",
  },
  { code: "TD", name: "Chad", flag: "https://flagcdn.com/w80/td.png" },
  { code: "CL", name: "Chile", flag: "https://flagcdn.com/w80/cl.png" },
  { code: "CN", name: "China", flag: "https://flagcdn.com/w80/cn.png" },
  {
    code: "CX",
    name: "Christmas Island",
    flag: "https://flagcdn.com/w80/cx.png",
  },
  {
    code: "CC",
    name: "Cocos (Keeling) Islands",
    flag: "https://flagcdn.com/w80/cc.png",
  },
  { code: "CO", name: "Colombia", flag: "https://flagcdn.com/w80/co.png" },
  { code: "KM", name: "Comoros", flag: "https://flagcdn.com/w80/km.png" },
  { code: "CG", name: "Congo", flag: "https://flagcdn.com/w80/cg.png" },
  {
    code: "CD",
    name: "Congo, The Democratic Republic of the",
    flag: "https://flagcdn.com/w80/cd.png",
  },
  { code: "CK", name: "Cook Islands", flag: "https://flagcdn.com/w80/ck.png" },
  { code: "CR", name: "Costa Rica", flag: "https://flagcdn.com/w80/cr.png" },
  { code: "HR", name: "Croatia", flag: "https://flagcdn.com/w80/hr.png" },
  { code: "CU", name: "Cuba", flag: "https://flagcdn.com/w80/cu.png" },
  { code: "CW", name: "Curaçao", flag: "https://flagcdn.com/w80/cw.png" },
  { code: "CY", name: "Cyprus", flag: "https://flagcdn.com/w80/cy.png" },
  { code: "CZ", name: "Czechia", flag: "https://flagcdn.com/w80/cz.png" },
  { code: "CI", name: "Côte d'Ivoire", flag: "https://flagcdn.com/w80/ci.png" },
  { code: "DK", name: "Denmark", flag: "https://flagcdn.com/w80/dk.png" },
  { code: "DJ", name: "Djibouti", flag: "https://flagcdn.com/w80/dj.png" },
  { code: "DM", name: "Dominica", flag: "https://flagcdn.com/w80/dm.png" },
  {
    code: "DO",
    name: "Dominican Republic",
    flag: "https://flagcdn.com/w80/do.png",
  },
  { code: "EC", name: "Ecuador", flag: "https://flagcdn.com/w80/ec.png" },
  { code: "EG", name: "Egypt", flag: "https://flagcdn.com/w80/eg.png" },
  { code: "SV", name: "El Salvador", flag: "https://flagcdn.com/w80/sv.png" },
  {
    code: "GQ",
    name: "Equatorial Guinea",
    flag: "https://flagcdn.com/w80/gq.png",
  },
  { code: "ER", name: "Eritrea", flag: "https://flagcdn.com/w80/er.png" },
  { code: "EE", name: "Estonia", flag: "https://flagcdn.com/w80/ee.png" },
  { code: "SZ", name: "Eswatini", flag: "https://flagcdn.com/w80/sz.png" },
  { code: "ET", name: "Ethiopia", flag: "https://flagcdn.com/w80/et.png" },
  {
    code: "FK",
    name: "Falkland Islands (Malvinas)",
    flag: "https://flagcdn.com/w80/fk.png",
  },
  { code: "FO", name: "Faroe Islands", flag: "https://flagcdn.com/w80/fo.png" },
  { code: "FJ", name: "Fiji", flag: "https://flagcdn.com/w80/fj.png" },
  { code: "FI", name: "Finland", flag: "https://flagcdn.com/w80/fi.png" },
  { code: "FR", name: "France", flag: "https://flagcdn.com/w80/fr.png" },
  { code: "GF", name: "French Guiana", flag: "https://flagcdn.com/w80/gf.png" },
  {
    code: "PF",
    name: "French Polynesia",
    flag: "https://flagcdn.com/w80/pf.png",
  },
  {
    code: "TF",
    name: "French Southern Territories",
    flag: "https://flagcdn.com/w80/tf.png",
  },
  { code: "GA", name: "Gabon", flag: "https://flagcdn.com/w80/ga.png" },
  { code: "GM", name: "Gambia", flag: "https://flagcdn.com/w80/gm.png" },
  { code: "GE", name: "Georgia", flag: "https://flagcdn.com/w80/ge.png" },
  { code: "DE", name: "Germany", flag: "https://flagcdn.com/w80/de.png" },
  { code: "GH", name: "Ghana", flag: "https://flagcdn.com/w80/gh.png" },
  { code: "GI", name: "Gibraltar", flag: "https://flagcdn.com/w80/gi.png" },
  { code: "GR", name: "Greece", flag: "https://flagcdn.com/w80/gr.png" },
  { code: "GL", name: "Greenland", flag: "https://flagcdn.com/w80/gl.png" },
  { code: "GD", name: "Grenada", flag: "https://flagcdn.com/w80/gd.png" },
  { code: "GP", name: "Guadeloupe", flag: "https://flagcdn.com/w80/gp.png" },
  { code: "GU", name: "Guam", flag: "https://flagcdn.com/w80/gu.png" },
  { code: "GT", name: "Guatemala", flag: "https://flagcdn.com/w80/gt.png" },
  { code: "GG", name: "Guernsey", flag: "https://flagcdn.com/w80/gg.png" },
  { code: "GN", name: "Guinea", flag: "https://flagcdn.com/w80/gn.png" },
  { code: "GW", name: "Guinea-Bissau", flag: "https://flagcdn.com/w80/gw.png" },
  { code: "GY", name: "Guyana", flag: "https://flagcdn.com/w80/gy.png" },
  { code: "HT", name: "Haiti", flag: "https://flagcdn.com/w80/ht.png" },
  {
    code: "HM",
    name: "Heard Island and McDonald Islands",
    flag: "https://flagcdn.com/w80/hm.png",
  },
  {
    code: "VA",
    name: "Holy See (Vatican City State)",
    flag: "https://flagcdn.com/w80/va.png",
  },
  { code: "HN", name: "Honduras", flag: "https://flagcdn.com/w80/hn.png" },
  { code: "HK", name: "Hong Kong", flag: "https://flagcdn.com/w80/hk.png" },
  { code: "HU", name: "Hungary", flag: "https://flagcdn.com/w80/hu.png" },
  { code: "IS", name: "Iceland", flag: "https://flagcdn.com/w80/is.png" },
  { code: "IN", name: "India", flag: "https://flagcdn.com/w80/in.png" },
  { code: "ID", name: "Indonesia", flag: "https://flagcdn.com/w80/id.png" },
  {
    code: "IR",
    name: "Iran, Islamic Republic of",
    flag: "https://flagcdn.com/w80/ir.png",
  },
  { code: "IQ", name: "Iraq", flag: "https://flagcdn.com/w80/iq.png" },
  { code: "IE", name: "Ireland", flag: "https://flagcdn.com/w80/ie.png" },
  { code: "IM", name: "Isle of Man", flag: "https://flagcdn.com/w80/im.png" },
  { code: "IL", name: "Israel", flag: "https://flagcdn.com/w80/il.png" },
  { code: "IT", name: "Italy", flag: "https://flagcdn.com/w80/it.png" },
  { code: "JM", name: "Jamaica", flag: "https://flagcdn.com/w80/jm.png" },
  { code: "JP", name: "Japan", flag: "https://flagcdn.com/w80/jp.png" },
  { code: "JE", name: "Jersey", flag: "https://flagcdn.com/w80/je.png" },
  { code: "JO", name: "Jordan", flag: "https://flagcdn.com/w80/jo.png" },
  { code: "KZ", name: "Kazakhstan", flag: "https://flagcdn.com/w80/kz.png" },
  { code: "KE", name: "Kenya", flag: "https://flagcdn.com/w80/ke.png" },
  { code: "KI", name: "Kiribati", flag: "https://flagcdn.com/w80/ki.png" },
  {
    code: "KP",
    name: "Korea, Democratic People's Republic of",
    flag: "https://flagcdn.com/w80/kp.png",
  },
  {
    code: "KR",
    name: "Korea, Republic of",
    flag: "https://flagcdn.com/w80/kr.png",
  },
  { code: "KW", name: "Kuwait", flag: "https://flagcdn.com/w80/kw.png" },
  { code: "KG", name: "Kyrgyzstan", flag: "https://flagcdn.com/w80/kg.png" },
  {
    code: "LA",
    name: "Lao People's Democratic Republic",
    flag: "https://flagcdn.com/w80/la.png",
  },
  { code: "LV", name: "Latvia", flag: "https://flagcdn.com/w80/lv.png" },
  { code: "LB", name: "Lebanon", flag: "https://flagcdn.com/w80/lb.png" },
  { code: "LS", name: "Lesotho", flag: "https://flagcdn.com/w80/ls.png" },
  { code: "LR", name: "Liberia", flag: "https://flagcdn.com/w80/lr.png" },
  { code: "LY", name: "Libya", flag: "https://flagcdn.com/w80/ly.png" },
  { code: "LI", name: "Liechtenstein", flag: "https://flagcdn.com/w80/li.png" },
  { code: "LT", name: "Lithuania", flag: "https://flagcdn.com/w80/lt.png" },
  { code: "LU", name: "Luxembourg", flag: "https://flagcdn.com/w80/lu.png" },
  { code: "MO", name: "Macao", flag: "https://flagcdn.com/w80/mo.png" },
  { code: "MG", name: "Madagascar", flag: "https://flagcdn.com/w80/mg.png" },
  { code: "MW", name: "Malawi", flag: "https://flagcdn.com/w80/mw.png" },
  { code: "MY", name: "Malaysia", flag: "https://flagcdn.com/w80/my.png" },
  { code: "MV", name: "Maldives", flag: "https://flagcdn.com/w80/mv.png" },
  { code: "ML", name: "Mali", flag: "https://flagcdn.com/w80/ml.png" },
  { code: "MT", name: "Malta", flag: "https://flagcdn.com/w80/mt.png" },
  {
    code: "MH",
    name: "Marshall Islands",
    flag: "https://flagcdn.com/w80/mh.png",
  },
  { code: "MQ", name: "Martinique", flag: "https://flagcdn.com/w80/mq.png" },
  { code: "MR", name: "Mauritania", flag: "https://flagcdn.com/w80/mr.png" },
  { code: "MU", name: "Mauritius", flag: "https://flagcdn.com/w80/mu.png" },
  { code: "YT", name: "Mayotte", flag: "https://flagcdn.com/w80/yt.png" },
  { code: "MX", name: "Mexico", flag: "https://flagcdn.com/w80/mx.png" },
  {
    code: "FM",
    name: "Micronesia, Federated States of",
    flag: "https://flagcdn.com/w80/fm.png",
  },
  {
    code: "MD",
    name: "Moldova, Republic of",
    flag: "https://flagcdn.com/w80/md.png",
  },
  { code: "MC", name: "Monaco", flag: "https://flagcdn.com/w80/mc.png" },
  { code: "MN", name: "Mongolia", flag: "https://flagcdn.com/w80/mn.png" },
  { code: "ME", name: "Montenegro", flag: "https://flagcdn.com/w80/me.png" },
  { code: "MS", name: "Montserrat", flag: "https://flagcdn.com/w80/ms.png" },
  { code: "MA", name: "Morocco", flag: "https://flagcdn.com/w80/ma.png" },
  { code: "MZ", name: "Mozambique", flag: "https://flagcdn.com/w80/mz.png" },
  { code: "MM", name: "Myanmar", flag: "https://flagcdn.com/w80/mm.png" },
  { code: "NA", name: "Namibia", flag: "https://flagcdn.com/w80/na.png" },
  { code: "NR", name: "Nauru", flag: "https://flagcdn.com/w80/nr.png" },
  { code: "NP", name: "Nepal", flag: "https://flagcdn.com/w80/np.png" },
  { code: "NL", name: "Netherlands", flag: "https://flagcdn.com/w80/nl.png" },
  { code: "NC", name: "New Caledonia", flag: "https://flagcdn.com/w80/nc.png" },
  { code: "NZ", name: "New Zealand", flag: "https://flagcdn.com/w80/nz.png" },
  { code: "NI", name: "Nicaragua", flag: "https://flagcdn.com/w80/ni.png" },
  { code: "NE", name: "Niger", flag: "https://flagcdn.com/w80/ne.png" },
  { code: "NG", name: "Nigeria", flag: "https://flagcdn.com/w80/ng.png" },
  { code: "NU", name: "Niue", flag: "https://flagcdn.com/w80/nu.png" },
  {
    code: "NF",
    name: "Norfolk Island",
    flag: "https://flagcdn.com/w80/nf.png",
  },
  {
    code: "MK",
    name: "North Macedonia",
    flag: "https://flagcdn.com/w80/mk.png",
  },
  {
    code: "MP",
    name: "Northern Mariana Islands",
    flag: "https://flagcdn.com/w80/mp.png",
  },
  { code: "NO", name: "Norway", flag: "https://flagcdn.com/w80/no.png" },
  { code: "OM", name: "Oman", flag: "https://flagcdn.com/w80/om.png" },
  { code: "PK", name: "Pakistan", flag: "https://flagcdn.com/w80/pk.png" },
  { code: "PW", name: "Palau", flag: "https://flagcdn.com/w80/pw.png" },
  {
    code: "PS",
    name: "Palestine, State of",
    flag: "https://flagcdn.com/w80/ps.png",
  },
  { code: "PA", name: "Panama", flag: "https://flagcdn.com/w80/pa.png" },
  {
    code: "PG",
    name: "Papua New Guinea",
    flag: "https://flagcdn.com/w80/pg.png",
  },
  { code: "PY", name: "Paraguay", flag: "https://flagcdn.com/w80/py.png" },
  { code: "PE", name: "Peru", flag: "https://flagcdn.com/w80/pe.png" },
  { code: "PH", name: "Philippines", flag: "https://flagcdn.com/w80/ph.png" },
  { code: "PN", name: "Pitcairn", flag: "https://flagcdn.com/w80/pn.png" },
  { code: "PL", name: "Poland", flag: "https://flagcdn.com/w80/pl.png" },
  { code: "PT", name: "Portugal", flag: "https://flagcdn.com/w80/pt.png" },
  { code: "PR", name: "Puerto Rico", flag: "https://flagcdn.com/w80/pr.png" },
  { code: "QA", name: "Qatar", flag: "https://flagcdn.com/w80/qa.png" },
  { code: "RO", name: "Romania", flag: "https://flagcdn.com/w80/ro.png" },
  {
    code: "RU",
    name: "Russian Federation",
    flag: "https://flagcdn.com/w80/ru.png",
  },
  { code: "RW", name: "Rwanda", flag: "https://flagcdn.com/w80/rw.png" },
  { code: "RE", name: "Réunion", flag: "https://flagcdn.com/w80/re.png" },
  {
    code: "BL",
    name: "Saint Barthélemy",
    flag: "https://flagcdn.com/w80/bl.png",
  },
  {
    code: "SH",
    name: "Saint Helena, Ascension and Tristan da Cunha",
    flag: "https://flagcdn.com/w80/sh.png",
  },
  {
    code: "KN",
    name: "Saint Kitts and Nevis",
    flag: "https://flagcdn.com/w80/kn.png",
  },
  { code: "LC", name: "Saint Lucia", flag: "https://flagcdn.com/w80/lc.png" },
  {
    code: "MF",
    name: "Saint Martin (French part)",
    flag: "https://flagcdn.com/w80/mf.png",
  },
  {
    code: "PM",
    name: "Saint Pierre and Miquelon",
    flag: "https://flagcdn.com/w80/pm.png",
  },
  {
    code: "VC",
    name: "Saint Vincent and the Grenadines",
    flag: "https://flagcdn.com/w80/vc.png",
  },
  { code: "WS", name: "Samoa", flag: "https://flagcdn.com/w80/ws.png" },
  { code: "SM", name: "San Marino", flag: "https://flagcdn.com/w80/sm.png" },
  {
    code: "ST",
    name: "Sao Tome and Principe",
    flag: "https://flagcdn.com/w80/st.png",
  },
  { code: "SA", name: "Saudi Arabia", flag: "https://flagcdn.com/w80/sa.png" },
  { code: "SN", name: "Senegal", flag: "https://flagcdn.com/w80/sn.png" },
  { code: "RS", name: "Serbia", flag: "https://flagcdn.com/w80/rs.png" },
  { code: "SC", name: "Seychelles", flag: "https://flagcdn.com/w80/sc.png" },
  { code: "SL", name: "Sierra Leone", flag: "https://flagcdn.com/w80/sl.png" },
  { code: "SG", name: "Singapore", flag: "https://flagcdn.com/w80/sg.png" },
  {
    code: "SX",
    name: "Sint Maarten (Dutch part)",
    flag: "https://flagcdn.com/w80/sx.png",
  },
  { code: "SK", name: "Slovakia", flag: "https://flagcdn.com/w80/sk.png" },
  { code: "SI", name: "Slovenia", flag: "https://flagcdn.com/w80/si.png" },
  {
    code: "SB",
    name: "Solomon Islands",
    flag: "https://flagcdn.com/w80/sb.png",
  },
  { code: "SO", name: "Somalia", flag: "https://flagcdn.com/w80/so.png" },
  { code: "ZA", name: "South Africa", flag: "https://flagcdn.com/w80/za.png" },
  {
    code: "GS",
    name: "South Georgia and the South Sandwich Islands",
    flag: "https://flagcdn.com/w80/gs.png",
  },
  { code: "SS", name: "South Sudan", flag: "https://flagcdn.com/w80/ss.png" },
  { code: "ES", name: "Spain", flag: "https://flagcdn.com/w80/es.png" },
  { code: "LK", name: "Sri Lanka", flag: "https://flagcdn.com/w80/lk.png" },
  { code: "SD", name: "Sudan", flag: "https://flagcdn.com/w80/sd.png" },
  { code: "SR", name: "Suriname", flag: "https://flagcdn.com/w80/sr.png" },
  {
    code: "SJ",
    name: "Svalbard and Jan Mayen",
    flag: "https://flagcdn.com/w80/sj.png",
  },
  { code: "SE", name: "Sweden", flag: "https://flagcdn.com/w80/se.png" },
  { code: "CH", name: "Switzerland", flag: "https://flagcdn.com/w80/ch.png" },
  {
    code: "SY",
    name: "Syrian Arab Republic",
    flag: "https://flagcdn.com/w80/sy.png",
  },
  {
    code: "TW",
    name: "Taiwan, Province of China",
    flag: "https://flagcdn.com/w80/tw.png",
  },
  { code: "TJ", name: "Tajikistan", flag: "https://flagcdn.com/w80/tj.png" },
  {
    code: "TZ",
    name: "Tanzania, United Republic of",
    flag: "https://flagcdn.com/w80/tz.png",
  },
  { code: "TH", name: "Thailand", flag: "https://flagcdn.com/w80/th.png" },
  { code: "TL", name: "Timor-Leste", flag: "https://flagcdn.com/w80/tl.png" },
  { code: "TG", name: "Togo", flag: "https://flagcdn.com/w80/tg.png" },
  { code: "TK", name: "Tokelau", flag: "https://flagcdn.com/w80/tk.png" },
  { code: "TO", name: "Tonga", flag: "https://flagcdn.com/w80/to.png" },
  {
    code: "TT",
    name: "Trinidad and Tobago",
    flag: "https://flagcdn.com/w80/tt.png",
  },
  { code: "TN", name: "Tunisia", flag: "https://flagcdn.com/w80/tn.png" },
  { code: "TM", name: "Turkmenistan", flag: "https://flagcdn.com/w80/tm.png" },
  {
    code: "TC",
    name: "Turks and Caicos Islands",
    flag: "https://flagcdn.com/w80/tc.png",
  },
  { code: "TV", name: "Tuvalu", flag: "https://flagcdn.com/w80/tv.png" },
  { code: "TR", name: "Türkiye", flag: "https://flagcdn.com/w80/tr.png" },
  { code: "UG", name: "Uganda", flag: "https://flagcdn.com/w80/ug.png" },
  { code: "UA", name: "Ukraine", flag: "https://flagcdn.com/w80/ua.png" },
  {
    code: "AE",
    name: "United Arab Emirates",
    flag: "https://flagcdn.com/w80/ae.png",
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "https://flagcdn.com/w80/gb.png",
  },
  { code: "US", name: "United States", flag: "https://flagcdn.com/w80/us.png" },
  {
    code: "UM",
    name: "United States Minor Outlying Islands",
    flag: "https://flagcdn.com/w80/um.png",
  },
  { code: "UY", name: "Uruguay", flag: "https://flagcdn.com/w80/uy.png" },
  { code: "UZ", name: "Uzbekistan", flag: "https://flagcdn.com/w80/uz.png" },
  { code: "VU", name: "Vanuatu", flag: "https://flagcdn.com/w80/vu.png" },
  {
    code: "VE",
    name: "Venezuela, Bolivarian Republic of",
    flag: "https://flagcdn.com/w80/ve.png",
  },
  { code: "VN", name: "Viet Nam", flag: "https://flagcdn.com/w80/vn.png" },
  {
    code: "VG",
    name: "Virgin Islands, British",
    flag: "https://flagcdn.com/w80/vg.png",
  },
  {
    code: "VI",
    name: "Virgin Islands, U.S.",
    flag: "https://flagcdn.com/w80/vi.png",
  },
  {
    code: "WF",
    name: "Wallis and Futuna",
    flag: "https://flagcdn.com/w80/wf.png",
  },
  {
    code: "EH",
    name: "Western Sahara",
    flag: "https://flagcdn.com/w80/eh.png",
  },
  { code: "YE", name: "Yemen", flag: "https://flagcdn.com/w80/ye.png" },
  { code: "ZM", name: "Zambia", flag: "https://flagcdn.com/w80/zm.png" },
  { code: "ZW", name: "Zimbabwe", flag: "https://flagcdn.com/w80/zw.png" },
  { code: "AX", name: "Åland Islands", flag: "https://flagcdn.com/w80/ax.png" },
  { code: "OTHER", name: "Other Country...", flag: "" },
];

export default ALL_COUNTRIES;

const PROFESSIONS = [
  {
    id: "commercant",
    label: "E-Commerce & Retail",
    sub: "Online store, DTC brand, physical retail",
  },
  {
    id: "dev",
    label: "Developer & Engineering",
    sub: "APIs, SDKs, SaaS & Webhooks",
  },
  {
    id: "marketer",
    label: "Marketing & Growth",
    sub: "Paid acquisition, UTM attribution, campaigns",
  },
  {
    id: "creator",
    label: "Creator & Media",
    sub: "Bio links, YouTube, social distribution",
  },
  {
    id: "founder",
    label: "Founder & Executive",
    sub: "Startup, agency, product leadership",
  },
  {
    id: "other_prof",
    label: "Other Industry",
    sub: "Custom workflow & link operations",
  },
];

const VOLUME_TIERS = [
  { id: "under_10k", label: "Just getting started (< 10,000 clicks/mo)" },
  { id: "10k-100k", label: "Growing fast (10,000 – 100,000 clicks/mo)" },
  { id: "100k-1m", label: "High scale (100,000 – 1M+ clicks/mo)" },
  { id: "enterprise", label: "Enterprise Edge (> 1M+ clicks/mo)" },
];

const SOURCES = [
  {
    id: "twitter",
    label: "X (Twitter) / Social Media",
    logo: "https://cdn.simpleicons.org/x",
  },
  {
    id: "google",
    label: "Google Search / Documentation",
    logo: "https://cdn.simpleicons.org/google",
  },
  {
    id: "github",
    label: "GitHub / Developer Community",
    logo: "https://cdn.simpleicons.org/github",
  },
  {
    id: "youtube",
    label: "YouTube / Product Review",
    logo: "https://cdn.simpleicons.org/youtube",
  },
  {
    id: "linkedin",
    label: "LinkedIn / Professional Network",
    logo: "https://cdn.simpleicons.org/linkedin",
  },
  {
    id: "facebook",
    label: "Facebook / Social Media",
    logo: "https://cdn.simpleicons.org/facebook",
  },
  {
    id: "instagram",
    label: "Instagram / Social Media",
    logo: "https://cdn.simpleicons.org/instagram",
  },
  {
    id: "tiktok",
    label: "TikTok / Social Media",
    logo: "https://cdn.simpleicons.org/tiktok",
  },
  {
    id: "reddit",
    label: "Reddit / Community",
    logo: "https://cdn.simpleicons.org/reddit",
  },
  {
    id: "discord",
    label: "Discord / Community",
    logo: "https://cdn.simpleicons.org/discord",
  },
  {
    id: "telegram",
    label: "Telegram / Community",
    logo: "https://cdn.simpleicons.org/telegram",
  },
  {
    id: "producthunt",
    label: "Product Hunt",
    logo: "https://cdn.simpleicons.org/producthunt",
  },
  {
    id: "medium",
    label: "Medium / Blog",
    logo: "https://cdn.simpleicons.org/medium",
  },
  {
    id: "stackoverflow",
    label: "Stack Overflow / Developer Community",
    logo: "https://cdn.simpleicons.org/stackoverflow",
  },
  { id: "friend", label: "Colleague or Founder Referral", logo: "" },
  { id: "other_source", label: "Other Channel", logo: "" },
];

const USE_CASES = [
  {
    id: "short_links",
    label: "Short Links & Branded Custom Domains",
    desc: "High-speed <11ms edge redirects",
  },
  {
    id: "utm_attribution",
    label: "Revenue & Customer Attribution (lsh.track)",
    desc: "Track signups, Stripe sales & ROI per click",
  },
  {
    id: "api_sdk",
    label: "Developer REST API & TypeScript SDK",
    desc: "Programmatic link creation at scale",
  },
  {
    id: "smart_routing",
    label: "Smart Geo / Device Routing & A/B Split",
    desc: "Dynamic traffic distribution rules",
  },
  {
    id: "packaging_qr",
    label: "Dynamic QR Studio & Bio-Link Hub",
    desc: "Vector QR codes & customizable bio pages",
  },
  {
    id: "pathlock",
    label: "PathLock™ URL Masking & PIN Gate",
    desc: "Zero-trust link protection & expiration",
  },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const userEmail = session?.user?.email || "";
  const userId =
    session?.user?.id ||
    (session?.user as { userId?: string })?.userId ||
    userEmail;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active card focus state for the SaleSkip floating-label aesthetic
  const [activeField, setActiveField] = useState<string>("field-3");

  // Step 1 State: Profile & Industry (matches reference screenshot fields + workspace)
  const [sellingStatus, setSellingStatus] = useState(
    "Yes, actively scaling traffic",
  );
  const [monthlyVolume, setMonthlyVolume] = useState("10k-100k");
  const [profession, setProfession] = useState("commercant");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Step 2 State: Location & Workspace
  const [country, setCountry] = useState(ALL_COUNTRIES[0]);
  const [countrySearch, setCountrySearch] = useState("");
  const [city, setCity] = useState("New York");
  const [workspaceName, setWorkspaceName] = useState("My Workspace");

  // Step 3 State: Discovery & Attribution
  const [source, setSource] = useState("twitter");
  const [primaryDomainMode, setPrimaryDomainMode] = useState(
    "lsho.cc Edge Shortener + Custom Domain",
  );

  // Step 4 State: Core Features / Use Cases
  const [useCases, setUseCases] = useState<string[]>([
    "short_links",
    "utm_attribution",
    "api_sdk",
  ]);

  const completeOnboardingMutation = useMutation(api.users.completeOnboarding);

  // GSAP Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const stepCircleRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const totalSteps = 4;

  // Initial mount entrance animation via GSAP
  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.65, ease: "power3.out" },
    );
  }, []);

  // Animate step transition & progress line with GSAP whenever currentStep changes
  useEffect(() => {
    if (progressLineRef.current) {
      const pct = ((currentStep - 1) / (totalSteps - 1)) * 100;
      gsap.to(progressLineRef.current, {
        width: `${pct}%`,
        duration: 0.45,
        ease: "power3.out",
      });
    }

    const activeCircle = stepCircleRefs.current[currentStep - 1];
    if (activeCircle) {
      gsap.fromTo(
        activeCircle,
        { scale: 0.82 },
        { scale: 1, duration: 0.4, ease: "back.out(2)" },
      );
    }

    if (stepContentRef.current) {
      const cards = stepContentRef.current.querySelectorAll(".onb-card-item");
      gsap.fromTo(
        stepContentRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.38, ease: "power3.out" },
      );
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.06,
            ease: "power2.out",
          },
        );
      }
    }
    setOpenDropdown(null);
  }, [currentStep]);

  const filteredCountries = ALL_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const toggleUseCase = (id: string) => {
    setUseCases((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((item) => item !== id)
          : prev
        : [...prev, id],
    );
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const activeUserId = userId || userEmail;
      if (activeUserId) {
        await completeOnboardingMutation({
          userId: activeUserId,
          email: userEmail || undefined,
          country: country.code,
          city: city.trim() || undefined,
          language: "en",
          profession,
          source,
          useCases,
          role: profession || "other",
          goal: useCases.length > 0 ? useCases.join(", ") : "general",
          monthlyClicksEstimate: monthlyVolume,
          workspaceName: workspaceName.trim() || "My Workspace",
        });
      }

      try {
        await updateSession?.({ hasCompletedOnboarding: true });
      } catch {}

      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 },
      });

      showToast.success("Welcome to LShorter! Your workspace is ready.");
      setTimeout(() => {
        router.replace("/dashboard");
      }, 650);
    } catch (err) {
      console.error(err);
      showToast.error("Error saving onboarding details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const activeUserId = userId || userEmail;
      if (activeUserId) {
        await completeOnboardingMutation({
          userId: activeUserId,
          email: userEmail || undefined,
          country: country.code || "US",
          city: city || undefined,
          language: "en",
          profession: profession || "general",
          source: source || "direct",
          useCases: useCases.length ? useCases : ["general"],
          role: profession || "general",
          goal: "general",
          monthlyClicksEstimate: monthlyVolume || "10k-100k",
          workspaceName: workspaceName || "My Workspace",
        });
      }

      try {
        await updateSession?.({ hasCompletedOnboarding: true });
      } catch {}

      router.replace("/dashboard");
    } catch {
      router.replace("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProfessionObj =
    PROFESSIONS.find((p) => p.id === profession) || PROFESSIONS[0];
  const selectedVolumeObj =
    VOLUME_TIERS.find((v) => v.id === monthlyVolume) || VOLUME_TIERS[1];
  const selectedSourceObj = SOURCES.find((s) => s.id === source) || SOURCES[0];

  return (
    <div className="min-h-screen w-full bg-[#fafafa] dark:bg-[#09090b] text-[#09090b] dark:text-[#fafafa] flex flex-col items-center justify-center px-4 py-10 select-none transition-colors duration-300">
      <div
        ref={containerRef}
        className="w-full max-w-[440px] mx-auto flex flex-col items-center"
      >
        {/* =========================================================
            1. TOP CENTERED BRAND LOGO (SaleSkip Layout)
           ========================================================= */}
        <a
          href="/"
          className="flex items-center gap-2.5 mb-9 group cursor-pointer"
          title="Retour à la landing page"
        >
          <div className="w-8 h-8 rounded-[10px] bg-[#465FFF] group-hover:bg-[#3641F5] flex items-center justify-center text-white font-extrabold text-sm tracking-tight shadow-[0_4px_12px_rgba(70,95,255,0.28)] transition-colors">
            LS
          </div>
          <span className="text-xl font-bold tracking-tight text-[#09090b] dark:text-white">
            LShorter
          </span>
        </a>

        {/* =========================================================
            2. HORIZONTAL 4-STEP NUMBERED STEPPER WITH LINE
           ========================================================= */}
        <div className="w-full max-w-[300px] mb-9 relative flex items-center justify-between">
          {/* Background connecting line */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[1.5px] bg-[#e4e4e7] dark:bg-[#27272a] z-0">
            <div
              ref={progressLineRef}
              className="h-full bg-[#0066FF]"
              style={{ width: "0%" }}
            />
          </div>

          {[1, 2, 3, 4].map((step) => {
            const isActive = currentStep === step;
            const isCompleted = currentStep > step;
            return (
              <button
                key={step}
                ref={(el) => {
                  stepCircleRefs.current[step - 1] = el;
                }}
                type="button"
                onClick={() => setCurrentStep(step)}
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#0066FF] text-white shadow-[0_4px_14px_rgba(0,102,255,0.35)] ring-4 ring-[#0066FF]/15"
                    : isCompleted
                      ? "bg-[#0066FF] text-white"
                      : "bg-white dark:bg-[#121215] border border-[#e4e4e7] dark:border-[#27272a] text-[#09090b] dark:text-[#a1a1aa] hover:border-[#0066FF]/50"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  step
                )}
              </button>
            );
          })}
        </div>

        {/* =========================================================
            3. STEP HEADER & SUBTITLE
           ========================================================= */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#09090b] dark:text-white">
            {currentStep === 1 && "Onboarding Getting Started!"}
            {currentStep === 2 && "Configure Your Edge Region"}
            {currentStep === 3 && "Routing & Attribution Setup"}
            {currentStep === 4 && "Select Your Core Modules"}
          </h1>
          <p className="text-xs sm:text-sm text-[#71717a] dark:text-[#a1a1aa] mt-2">
            Allow us to offer you a pleasant experience.
          </p>
        </div>

        {/* =========================================================
            4. STEP FIELDS CONTAINER (Animated by GSAP)
           ========================================================= */}
        <div ref={stepContentRef} className="w-full space-y-3 mb-7">
          {/* ---------------- STEP 1 ---------------- */}
          {currentStep === 1 && (
            <>
              {/* Field 1: Are you already routing links / selling? */}
              <div className="onb-card-item relative">
                <div
                  onClick={() => {
                    setActiveField("field-1");
                    setOpenDropdown(
                      openDropdown === "selling" ? null : "selling",
                    );
                  }}
                  className={`w-full rounded-[10px] px-4 py-3.5 cursor-pointer transition-all ${
                    activeField === "field-1"
                      ? "bg-white dark:bg-[#121215] border-[1.5px] border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.10)]"
                      : "bg-[#f1f1f3] dark:bg-[#16161a] border border-transparent hover:border-[#e4e4e7] dark:hover:border-[#27272a]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">
                        Are you already managing short links or campaigns?
                      </div>
                      <div className="text-sm font-bold text-[#09090b] dark:text-white mt-0.5">
                        {sellingStatus}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#71717a] shrink-0" />
                  </div>
                </div>

                {openDropdown === "selling" && (
                  <div className="mt-1.5 w-full rounded-[10px] bg-white dark:bg-[#141418] border border-[#e4e4e7] dark:border-[#27272a] shadow-xl p-1.5 z-30 space-y-1">
                    {[
                      "Yes, actively scaling traffic",
                      "Migrating from Bitly / Dub / Rebrandly",
                      "Launching a brand new product or store",
                      "Integrating REST API & SDK in code",
                      "No",
                    ].map((opt) => (
                      <div
                        key={opt}
                        onClick={() => {
                          setSellingStatus(opt);
                          setOpenDropdown(null);
                        }}
                        className={`px-3 py-2 rounded-[10px] text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          sellingStatus === opt
                            ? "bg-[#0066FF]/10 text-[#0066FF] font-semibold"
                            : "text-[#09090b] dark:text-[#e4e4e7] hover:bg-[#f4f4f5] dark:hover:bg-[#1f1f24]"
                        }`}
                      >
                        <span>{opt}</span>
                        {sellingStatus === opt && (
                          <Check className="w-3.5 h-3.5 text-[#0066FF]" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 2: Monthly Click / Revenue Volume */}
              <div className="onb-card-item relative">
                <div
                  onClick={() => {
                    setActiveField("field-2");
                    setOpenDropdown(
                      openDropdown === "volume" ? null : "volume",
                    );
                  }}
                  className={`w-full rounded-[10px] px-4 py-3.5 cursor-pointer transition-all ${
                    activeField === "field-2"
                      ? "bg-white dark:bg-[#121215] border-[1.5px] border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.10)]"
                      : "bg-[#f1f1f3] dark:bg-[#16161a] border border-transparent hover:border-[#e4e4e7] dark:hover:border-[#27272a]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">
                        What is your estimated monthly click volume?
                      </div>
                      <div className="text-sm font-bold text-[#09090b] dark:text-white mt-0.5">
                        {selectedVolumeObj.label}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#71717a] shrink-0" />
                  </div>
                </div>

                {openDropdown === "volume" && (
                  <div className="mt-1.5 w-full rounded-[10px] bg-white dark:bg-[#141418] border border-[#e4e4e7] dark:border-[#27272a] shadow-xl p-1.5 z-30 space-y-1">
                    {VOLUME_TIERS.map((tier) => (
                      <div
                        key={tier.id}
                        onClick={() => {
                          setMonthlyVolume(tier.id);
                          setOpenDropdown(null);
                        }}
                        className={`px-3 py-2 rounded-[10px] text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          monthlyVolume === tier.id
                            ? "bg-[#0066FF]/10 text-[#0066FF] font-semibold"
                            : "text-[#09090b] dark:text-[#e4e4e7] hover:bg-[#f4f4f5] dark:hover:bg-[#1f1f24]"
                        }`}
                      >
                        <span>{tier.label}</span>
                        {monthlyVolume === tier.id && (
                          <Check className="w-3.5 h-3.5 text-[#0066FF]" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 3: Primary Industry / Role (Active by default like Clothing in SaleSkip) */}
              <div className="onb-card-item relative">
                <div
                  onClick={() => {
                    setActiveField("field-3");
                    setOpenDropdown(
                      openDropdown === "industry" ? null : "industry",
                    );
                  }}
                  className={`w-full rounded-[10px] px-4 py-3.5 cursor-pointer transition-all ${
                    activeField === "field-3"
                      ? "bg-white dark:bg-[#121215] border-[1.5px] border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.10)]"
                      : "bg-[#f1f1f3] dark:bg-[#16161a] border border-transparent hover:border-[#e4e4e7] dark:hover:border-[#27272a]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">
                        Which Industry will you be operating in?
                      </div>
                      <div className="text-sm font-bold text-[#09090b] dark:text-white mt-0.5">
                        {selectedProfessionObj.label}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#71717a] shrink-0" />
                  </div>
                </div>

                {openDropdown === "industry" && (
                  <div className="mt-1.5 w-full rounded-[10px] bg-white dark:bg-[#141418] border border-[#e4e4e7] dark:border-[#27272a] shadow-xl p-1.5 z-30 space-y-1">
                    {PROFESSIONS.map((prof) => (
                      <div
                        key={prof.id}
                        onClick={() => {
                          setProfession(prof.id);
                          setOpenDropdown(null);
                        }}
                        className={`px-3 py-2 rounded-[10px] text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          profession === prof.id
                            ? "bg-[#0066FF]/10 text-[#0066FF] font-semibold"
                            : "text-[#09090b] dark:text-[#e4e4e7] hover:bg-[#f4f4f5] dark:hover:bg-[#1f1f24]"
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{prof.label}</div>
                          <div className="text-[10px] text-[#71717a] dark:text-[#a1a1aa]">
                            {prof.sub}
                          </div>
                        </div>
                        {profession === prof.id && (
                          <Check className="w-3.5 h-3.5 text-[#0066FF]" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ---------------- STEP 2 ---------------- */}
          {currentStep === 2 && (
            <>
              {/* Country Selector Card */}
              <div className="onb-card-item relative">
                <div
                  onClick={() => {
                    setActiveField("step2-country");
                    setOpenDropdown(
                      openDropdown === "country" ? null : "country",
                    );
                  }}
                  className={`w-full rounded-[10px] px-4 py-3.5 cursor-pointer transition-all ${
                    activeField === "step2-country"
                      ? "bg-white dark:bg-[#121215] border-[1.5px] border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.10)]"
                      : "bg-[#f1f1f3] dark:bg-[#16161a] border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">
                        Primary Cloudflare Edge Country
                      </div>
                      <div className="text-sm font-bold text-[#09090b] dark:text-white mt-0.5 flex items-center gap-2">
                        <img
                          src={country?.flag}
                          alt={country?.name}
                          width={24}
                          height={24}
                        />
                        <span>{country.name}</span>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#71717a]" />
                  </div>
                </div>

                {openDropdown === "country" && (
                  <div className="mt-1.5 w-full rounded-[10px] bg-white dark:bg-[#141418] border border-[#e4e4e7] dark:border-[#27272a] shadow-xl p-2 z-30">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search country..."
                        className="w-full h-8 pl-8 pr-3 rounded-[10px] bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] text-xs text-[#09090b] dark:text-white focus:outline-none focus:border-[#0066FF]"
                      />
                    </div>
                    <div className="max-h-44 overflow-y-auto space-y-0.5 pr-1">
                      {filteredCountries.map((c) => (
                        <div
                          key={c.code}
                          onClick={() => {
                            setCountry(c);
                            setOpenDropdown(null);
                            setCountrySearch("");
                          }}
                          className={`px-3 py-1.5 rounded-[10px] text-xs cursor-pointer flex items-center justify-between ${
                            country.code === c.code
                              ? "bg-[#0066FF]/10 text-[#0066FF] font-semibold"
                              : "text-[#09090b] dark:text-[#e4e4e7] hover:bg-[#f4f4f5] dark:hover:bg-[#1f1f24]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <img
                              src={c?.flag}
                              alt={c?.name}
                              width={24}
                              height={24}
                            />
                            <span>{c.name}</span>
                          </span>
                          {country.code === c.code && (
                            <Check className="w-3.5 h-3.5 text-[#0066FF]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Primary City Input Card */}
              <div
                onClick={() => setActiveField("step2-city")}
                className={`onb-card-item w-full rounded-[10px] px-4 py-3 transition-all ${
                  activeField === "step2-city"
                    ? "bg-white dark:bg-[#121215] border-[1.5px] border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.10)]"
                    : "bg-[#f1f1f3] dark:bg-[#16161a] border border-transparent"
                }`}
              >
                <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">
                  Primary City / Hub
                </label>
                <input
                  type="text"
                  value={city}
                  onFocus={() => setActiveField("step2-city")}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New York, Paris, London, Tokyo..."
                  className="w-full bg-transparent text-sm font-bold text-[#09090b] dark:text-white mt-0.5 focus:outline-none placeholder:font-normal placeholder:text-[#a1a1aa]"
                />
              </div>

              {/* Workspace Name Card */}
              <div
                onClick={() => setActiveField("step2-workspace")}
                className={`onb-card-item w-full rounded-[10px] px-4 py-3 transition-all ${
                  activeField === "step2-workspace"
                    ? "bg-white dark:bg-[#121215] border-[1.5px] border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.10)]"
                    : "bg-[#f1f1f3] dark:bg-[#16161a] border border-transparent"
                }`}
              >
                <label className="block text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">
                  Organization / Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onFocus={() => setActiveField("step2-workspace")}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="My Workspace"
                  className="w-full bg-transparent text-sm font-bold text-[#09090b] dark:text-white mt-0.5 focus:outline-none placeholder:font-normal placeholder:text-[#a1a1aa]"
                />
              </div>
            </>
          )}

          {/* ---------------- STEP 3 ---------------- */}
          {currentStep === 3 && (
            <>
              {/* Discovery Channel */}
              <div className="onb-card-item relative">
                <div
                  onClick={() => {
                    setActiveField("step3-source");
                    setOpenDropdown(
                      openDropdown === "source" ? null : "source",
                    );
                  }}
                  className={`w-full rounded-[10px] px-4 py-3.5 cursor-pointer transition-all ${
                    activeField === "step3-source"
                      ? "bg-white dark:bg-[#121215] border-[1.5px] border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.10)]"
                      : "bg-[#f1f1f3] dark:bg-[#16161a] border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">
                        How did you hear about LShorter?
                      </div>
                      <div className="text-sm font-bold text-[#09090b] dark:text-white mt-0.5">
                        {selectedSourceObj.label}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#71717a]" />
                  </div>
                </div>

                {openDropdown === "source" && (
                  <div className="mt-1.5 w-full h-50 overflow-y-scroll rounded-[10px] bg-white dark:bg-[#141418] border border-[#e4e4e7] dark:border-[#27272a] shadow-xl p-1.5 z-30 space-y-1">
                    {SOURCES.map((src) => (
                      <div
                        key={src.id}
                        onClick={() => {
                          setSource(src.id);
                          setOpenDropdown(null);
                        }}
                        className={`px-3  py-2 rounded-[10px] text-xs cursor-pointer flex items-center justify-center gap-5 ${
                          source === src.id
                            ? "bg-[#0066FF]/10 text-[#0066FF] font-semibold"
                            : "text-[#09090b] dark:text-[#e4e4e7] hover:bg-[#f4f4f5] dark:hover:bg-[#1f1f24]"
                        }`}
                      >
                        <span>{src.label}</span>
                        {source === src.id && (
                          <Check className="w-3.5 h-3.5 text-[#0066FF]" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Domain Routing Mode */}
              <div className="onb-card-item relative">
                <div
                  onClick={() => {
                    setActiveField("step3-domain");
                    setOpenDropdown(
                      openDropdown === "domain" ? null : "domain",
                    );
                  }}
                  className={`w-full rounded-[10px] px-4 py-3.5 cursor-pointer transition-all ${
                    activeField === "step3-domain"
                      ? "bg-white dark:bg-[#121215] border-[1.5px] border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.10)]"
                      : "bg-[#f1f1f3] dark:bg-[#16161a] border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">
                        Preferred Link Domain Configuration
                      </div>
                      <div className="text-sm font-bold text-[#09090b] dark:text-white mt-0.5">
                        {primaryDomainMode}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#71717a]" />
                  </div>
                </div>

                {openDropdown === "domain" && (
                  <div className="mt-1.5 w-full rounded-[10px] bg-white dark:bg-[#141418] border border-[#e4e4e7] dark:border-[#27272a] shadow-xl p-1.5 z-30 space-y-1">
                    {[
                      "lsho.cc Edge Shortener + Custom Domain",
                      "Custom Branded Domain Only (CNAME Edge)",
                      "lsho.cc Instant Short Links Only",
                    ].map((mode) => (
                      <div
                        key={mode}
                        onClick={() => {
                          setPrimaryDomainMode(mode);
                          setOpenDropdown(null);
                        }}
                        className={`px-3 py-2 rounded-[10px] text-xs cursor-pointer flex items-center justify-between ${
                          primaryDomainMode === mode
                            ? "bg-[#0066FF]/10 text-[#0066FF] font-semibold"
                            : "text-[#09090b] dark:text-[#e4e4e7] hover:bg-[#f4f4f5] dark:hover:bg-[#1f1f24]"
                        }`}
                      >
                        <span>{mode}</span>
                        {primaryDomainMode === mode && (
                          <Check className="w-3.5 h-3.5 text-[#0066FF]" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attribution Mode Summary Card */}
              <div
                onClick={() => setActiveField("step3-sdk")}
                className={`onb-card-item w-full rounded-[10px] px-4 py-3.5 cursor-pointer transition-all ${
                  activeField === "step3-sdk"
                    ? "bg-white dark:bg-[#121215] border-[1.5px] border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.10)]"
                    : "bg-[#f1f1f3] dark:bg-[#16161a] border border-transparent"
                }`}
              >
                <div className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">
                  Revenue & Customer Attribution Engine
                </div>
                <div className="text-sm font-bold text-[#09090b] dark:text-white mt-0.5 flex items-center gap-1.5">
                  <span>Enabled (`lsh.track` + DiceBear Customer Grid)</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
                </div>
              </div>
            </>
          )}

          {/* ---------------- STEP 4 ---------------- */}
          {currentStep === 4 && (
            <div className="space-y-2.5">
              {USE_CASES.map((uc) => {
                const isSelected = useCases.includes(uc.id);
                return (
                  <div
                    key={uc.id}
                    onClick={() => toggleUseCase(uc.id)}
                    className={`onb-card-item w-full rounded-[10px] px-4 py-3 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-white dark:bg-[#121215] border-[1.5px] border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.10)]"
                        : "bg-[#f1f1f3] dark:bg-[#16161a] border border-transparent hover:border-[#e4e4e7] dark:hover:border-[#27272a]"
                    }`}
                  >
                    <div className="pr-3">
                      <div className="text-[11px] font-medium text-[#71717a] dark:text-[#a1a1aa]">
                        {uc.desc}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-[#09090b] dark:text-white mt-0.5">
                        {uc.label}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-[#0066FF] text-white"
                          : "bg-white dark:bg-[#09090b] border border-[#d4d4d8] dark:border-[#27272a]"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================
            5. FULL-WIDTH BLUE "NEXT" CTA BUTTON (SaleSkip Style)
           ========================================================= */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className="w-full h-12 rounded-[10px] bg-[#0066FF] hover:bg-[#0052cc] active:scale-[0.99] text-white font-semibold text-sm shadow-[0_6px_20px_rgba(0,102,255,0.32)] transition-all flex items-center justify-center cursor-pointer disabled:opacity-60"
        >
          {isSubmitting
            ? "Configuring Workspace..."
            : currentStep < totalSteps
              ? "Next"
              : "Launch Dashboard"}
        </button>

        {/* Subtle Back / Skip navigation row */}
        <div className="w-full flex items-center justify-between mt-4 px-1 text-xs text-[#71717a] dark:text-[#a1a1aa]">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s - 1)}
              className="hover:text-[#09090b] dark:hover:text-white transition-colors cursor-pointer font-medium"
            >
              ← Previous step
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}
